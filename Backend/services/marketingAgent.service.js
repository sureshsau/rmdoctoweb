import mongoose from "mongoose";
import User from "../models/user.model.js";
import AgentProfile from "../models/agentProfile.model.js";
import ROLE from "../models/role.model.js";
import RoleAssignment from '../models/roleAssignment.model.js'
import { hashPassword } from "../utils/password.js";
import { uploadAgreementToS3 } from "./aws.service.js";
import AppError from "../utils/AppError.js";
import marketingAgentProfile from "../models/marketingAgentProfile.model.js";
import { error } from "console";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";



const validateAgentPayload = ({
  agentName,
  phone,
  latitude,
  longitude
}) => {
  if (!agentName || !phone) {
    throw new Error("agentName and phone are required");
  }

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    throw new Error("Valid latitude and longitude are required");
  }
};

export const registerAgentByMarketingAgentService = async ({
  marketingAgentId,
  payload
}) => {
  console.log("creating agent");

  try {
    const {
      agentName,
      phone,
      password,

      latitude,
      longitude,

      address = null,
      city = null,
      state = null,
      pincode = null,

      parentAgentId = null
    } = payload;

    validateAgentPayload({ agentName, phone, latitude, longitude });

    // 🔍 1. Find user by phone
    let user = await User.findOne({ phone });
    if(user.roles.includes("marketing_agent")){
      throw new AppError("you can't register this user because this is a existing employee")
    }

    // if (user?.roles) {
    //   throw new AppError(`${user.roles} are already given to user`, 400);
    // }

    // 🔍 2. If agent profile already exists
    if (user?.profiles?.agentId) {
      const existingAgentProfile = await AgentProfile.findById(
        user.profiles.agentId
      );

      if (existingAgentProfile) {
        if (existingAgentProfile.marketingAgentId) {
          throw new AppError("Agent is already allocated to a marketing agent", 400);
        }
        if (existingAgentProfile.parentAgentId) {
          throw new AppError(
            "Agent already belongs to a network. Contact admin for transfer.",
            400
          );
        }

        // Assign if unallocated
        await AgentProfile.updateOne(
          { _id: existingAgentProfile._id },
          {
            $set: {
              marketingAgentId,
              registeredBy: "MARKETING_AGENT",
              agentName,
              address,
              city,
              state,
              pincode,
              location: {
                type: "Point",
                coordinates: [longitude, latitude]
              }
            }
          }
        );

        return {
          userId: user._id,
          agentProfileId: existingAgentProfile._id,
          message: "Existing agent assigned under marketing agent successfully"
        };
      }
    }

    // 🌳 MLM level
    let level = 0;
    if (parentAgentId) {
      const parentAgent = await AgentProfile.findById(parentAgentId);

      if (!parentAgent) {
        throw new Error("Parent agent not found");
      }

      level = parentAgent.level + 1;
    }

    // 🔹 3. Create user if not exists
    if (!user) {
      const passwordHash = await hashPassword(password);

      user = await User.create({
        name: agentName,
        phone,
        address,
        city,
        state,
        pincode,
        location: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        // NEW RBAC FIELDS
        dashboard: "agent",
        roles: ["agent"],
        permissions: [],
        isActive: true,
        isBlocked: false,
        passwordHash,
        kycStatus: "none"
      });
    }

    // 🔹 4. Create agent profile
    const agentProfile = await AgentProfile.create({
      userId: user._id,
      level,
      directDownlineCount: 0,
      totalDownlineCount: 0,
      marketingAgentId,
      
      registeredBy: "MARKETING_AGENT"
    });

    const agentProfileId = agentProfile._id;

    // 🔗 5. Link agent profile + RBAC update
    const role = await ROLE.findOne({ key: "agent" }).select("permissions").lean();


    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          dashboard: "agent",
          roles: ["agent"],
          permissions: role?.permissions || [],
          "profiles.agentId": agentProfileId,

        }
      }
    );
    return {
      userId: user._id,
      agentProfileId,
      message: "New agent registered successfully"
    };

  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getMarketingAgentTree = async ({
  marketingAgentUserId
}) => {
  try {
    /* =========================
       1️⃣ FETCH ROOT AGENTS (LEVEL 0)
    ========================= */
    const rootAgents = await AgentProfile.find({
      marketingAgentId: marketingAgentUserId,
      level: 0
    })
      .populate({
        path: "userId",
        select: "name phone"
      })
      .lean();

    if (!rootAgents.length) {
      return { success: true, tree: [] };
    }

    /* =========================
       2️⃣ PREPARE MAP & QUEUE
    ========================= */
    const agentMap = new Map();
    const queue = [];

    // Initialize roots
    for (const agent of rootAgents) {
      const node = {
        id: agent._id,
        name: agent.userId?.name || "",
        phone: agent.userId?.phone || "",
        level: agent.level,
        children: []
      };

      agentMap.set(agent._id.toString(), node);
      queue.push(agent); // push full agent doc for traversal
    }

    /* =========================
       3️⃣ BFS TRAVERSAL
    ========================= */
    while (queue.length > 0) {
      const currentAgent = queue.shift();
      const currentNode = agentMap.get(
        currentAgent._id.toString()
      );

      if (
        currentAgent.childAgentIds &&
        currentAgent.childAgentIds.length > 0
      ) {
        const children = await AgentProfile.find({
          _id: { $in: currentAgent.childAgentIds }
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

          agentMap.set(child._id.toString(), childNode);
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
      tree: Array.from(agentMap.values()).filter(
        node => node.level === 0
      )
    };
  } catch (error) {
    console.error("getMarketingAgentTree error:", error);
    throw error;
  }
};

export const getOrdersForMarketingAgentService = async ({
  marketingAgentUserId,
  status,
  page = 1,
  limit = 10
}) => {
  const query = {
    deliveryAgentId: marketingAgentUserId
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


const VALID_TRANSITIONS = {
  INITIATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: []
};

export const updateOrderStatusService = async ({
  orderId,
  newStatus,
  marketingAgentUserId,
  cancelReason
}) => {
  const order = await MedicineOrder.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  /* 🔐 AUTHORIZATION */
  if (
    !order.deliveryAgentId ||
    order.deliveryAgentId.toString() !== marketingAgentUserId.toString()
  ) {
    throw new AppError("Not authorized to update this order", 403);
  }

  /* 🔁 VALID STATUS TRANSITION */
  const allowed = VALID_TRANSITIONS[order.orderStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot change order from ${order.orderStatus} to ${newStatus}`,
      400
    );
  }

  order.orderStatus = newStatus;

  if (newStatus === "DELIVERED") {
    order.paymentStatus = "PAID";
    order.otpVerified = true;
  }

  if (newStatus === "CANCELLED") {
    order.cancelledReason = cancelReason || "Cancelled by delivery agent";
  }

  await order.save();

  return order;
};