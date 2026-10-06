import mongoose from "mongoose";
import User from "../models/user.model.js";
import CommunityPartnerProfile from "../models/communityPartnerProfile.model.js";
import ROLE from "../models/role.model.js";
import RoleAssignment from '../models/roleAssignment.model.js'
import { hashPassword } from "../utils/password.js";
import { uploadAgreementToS3 } from "./aws.service.js";
import AppError from "../utils/AppError.js";
import blockCoordinatorProfile from "../models/blockCoordinatorProfile.model.js";
import { error } from "console";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";



const validateCommunityPartnerPayload = ({
  communityPartnerName,
  phone,
  latitude,
  longitude
}) => {
  if (!communityPartnerName || !phone) {
    throw new Error("communityPartnerName and phone are required");
  }

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    throw new Error("Valid latitude and longitude are required");
  }
};

export const registerCommunityPartnerByBlockCoordinatorService = async ({
  blockCoordinatorId,
  payload
}) => {

  try {
    const {
      communityPartnerName,
      phone,
      latitude,
      longitude,
      address = null,
      landmark = null,
      city = null,
      state = null,
      pincode = null,
      parentCommunityPartnerId = null,
      shopName = null,
      visitFrequency = "MONTHLY"
    } = payload;

    validateCommunityPartnerPayload({ communityPartnerName, phone, latitude, longitude });

    /* The shop details ride on the community_partner profile, not the user account — the
       meet plan routes an executive to a shop, and a member can change shop
       without changing where they log in from. */
    const shopDetails = {
      shopName: shopName || communityPartnerName,
      address,
      landmark,
      city,
      state,
      pincode,
      visitFrequency: ["DAILY", "WEEKLY", "MONTHLY"].includes(
        String(visitFrequency).toUpperCase()
      )
        ? String(visitFrequency).toUpperCase()
        : "MONTHLY",
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    };

    // 🔍 1. Find user by phone
    let user = await User.findOne({ phone });

    if (
      user?.roles?.includes("block_coordinator") ||
      user?.roles?.includes("admin") ||
      user?.roles?.includes("subadmin")
    ) {
      throw new AppError(
        "You can't register this user because this is an existing employee"
      );
    }

    if (user?.roles?.length) {
      throw new AppError(`${user.roles} are already given to user`, 400);
    }

    // 🔍 2. If community_partner profile already exists
    if (user?.profiles?.communityPartnerId) {
      const existingCommunityPartnerProfile = await CommunityPartnerProfile.findById(
        user.profiles.communityPartnerId
      );

      if (existingCommunityPartnerProfile) {

        if (existingCommunityPartnerProfile.blockCoordinatorId) {
          throw new AppError(
            "Community Partner is already allocated to a Marketing Executive",
            400
          );
        }

        if (existingCommunityPartnerProfile.parentCommunityPartnerId) {
          throw new AppError(
            "Community Partner already belongs to a network. Contact admin for transfer.",
            400
          );
        }

        // Assign if unallocated
        await CommunityPartnerProfile.updateOne(
          { _id: existingCommunityPartnerProfile._id },
          {
            $set: {
              blockCoordinatorId,
              registeredBy: "MARKETING_AGENT",
              ...shopDetails
            }
          }
        );

        return {
          userId: user._id,
          communityPartnerProfileId: existingCommunityPartnerProfile._id,
          message: "Existing Community Partner assigned under Marketing Executive successfully"
        };
      }
    }

    // 🌳 MLM level calculation
    let level = 0;

    if (parentCommunityPartnerId) {
      const parentCommunityPartner = await CommunityPartnerProfile.findById(parentCommunityPartnerId);

      if (!parentCommunityPartner) {
        throw new Error("Parent Community Partner not found");
      }

      level = parentCommunityPartner.level + 1;
    }

    // 🔹 3. Create user if not exists
    if (!user) {
      user = await User.create({
        name: communityPartnerName,
        phone,
        address,
        landmark,
        city,
        state,
        pincode,
        location: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        dashboard: "community_partner",
        roles: ["community_partner"],
        permissions: [],
        isActive: true,
        isBlocked: false,
        kycStatus: "none"
      });
    }

    // 🔹 4. Create community_partner profile
    const communityPartnerProfile = await CommunityPartnerProfile.create({
      userId: user._id,
      level,
      directDownlineCount: 0,
      totalDownlineCount: 0,
      blockCoordinatorId,
      registeredBy: "MARKETING_AGENT",
      ...shopDetails
    });

    const communityPartnerProfileId = communityPartnerProfile._id;

    // 🔗 5. RBAC update
    const role = await ROLE.findOne({ key: "community_partner" })
      .select("permissions")
      .lean();

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          dashboard: "community_partner",
          roles: ["community_partner"],
          permissions: role?.permissions || [],
          "profiles.communityPartnerId": communityPartnerProfileId
        }
      }
    );

    return {
      userId: user._id,
      communityPartnerProfileId,
      message: "New Community Partner registered successfully"
    };

  } catch (error) {
    console.log(error);
    throw error;
  }
};


export const getBlockCoordinatorTree = async ({
  blockCoordinatorUserId
}) => {
  try {
    /* =========================
       1️⃣ FETCH ROOT AGENTS (LEVEL 0)
    ========================= */
    const rootCommunityPartners = await CommunityPartnerProfile.find({
      blockCoordinatorId: blockCoordinatorUserId,
      level: 0
    })
      .populate({
        path: "userId",
        select: "name phone"
      })
      .lean();

    if (!rootCommunityPartners.length) {
      return { success: true, tree: [] };
    }

    /* =========================
       2️⃣ PREPARE MAP & QUEUE
    ========================= */
    const community_partnerMap = new Map();
    const queue = [];

    // Initialize roots
    for (const community_partner of rootCommunityPartners) {
      const node = {
        id: community_partner._id,
        name: community_partner.userId?.name || "",
        phone: community_partner.userId?.phone || "",
        level: community_partner.level,
        children: []
      };

      community_partnerMap.set(community_partner._id.toString(), node);
      queue.push(community_partner); // push full community_partner doc for traversal
    }

    /* =========================
       3️⃣ BFS TRAVERSAL
    ========================= */
    while (queue.length > 0) {
      const currentCommunityPartner = queue.shift();
      const currentNode = community_partnerMap.get(
        currentCommunityPartner._id.toString()
      );

      if (
        currentCommunityPartner.childCommunityPartnerIds &&
        currentCommunityPartner.childCommunityPartnerIds.length > 0
      ) {
        const children = await CommunityPartnerProfile.find({
          _id: { $in: currentCommunityPartner.childCommunityPartnerIds }
        })
          .populate({
            path: "userId",
            select: "name phone"
          })
          .lean();

        for (const child of children) {
          const childNode = {
            id: child._id,
            name: child.userId?.name || "",
            phone: child.userId?.phone || "",
            level: child.level,
            children: []
          };

          community_partnerMap.set(child._id.toString(), childNode);
          currentNode.children.push(childNode);
          queue.push(child);
        }
      }
    }

    /* =========================
       4️⃣ RETURN TREE
    ========================= */
    return {
      success: true,
      tree: Array.from(community_partnerMap.values()).filter(
        node => node.level === 0
      )
    };
  } catch (error) {
    console.error("getBlockCoordinatorTree error:", error);
    throw error;
  }
};

export const getOrdersForBlockCoordinatorService = async ({
  blockCoordinatorUserId,
  status,
  page = 1,
  limit = 10
}) => {
  const query = {
    blockCoordinatorId: blockCoordinatorUserId
  };

  if (status) {
    query.orderStatus = status;
  }

  const skip = (page - 1) * limit;

  /* =========================
     PARALLEL DB CALLS
  ========================= */
  const [orders, totalOrders] = await Promise.all([
    MedicineOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "name phone"
      })
      .populate({
        path: "items.medicineId",
        select: "name images"
      })
      .lean(),

    MedicineOrder.countDocuments(query)
  ]);

  /* =========================
     OVERVIEW SHAPE
  ========================= */
  const overviewOrders = orders.map(order => ({
    orderId: order._id,

    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMode: order.paymentMode,

    customer: {
      name: order.userId?.name || null,
      phone: order.userId?.phone || null
    },

    itemCount: order.items.length,

    totalAmount: order.pricing.payableAmount,

    deliveryAddress: {
      addressLine1: order.deliveryAddress.addressLine1,
      pincode: order.deliveryAddress.pincode
    },

    createdAt: order.createdAt
  }));

  return {
    orders: overviewOrders,
    pagination: {
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit
    }
  };
};

