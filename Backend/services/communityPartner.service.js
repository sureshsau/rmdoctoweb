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



//only for admin 
export const assignBlockCoordinatorToCommunityPartner = async ({
  communityPartnerUserId,
  blockCoordinatorUserId
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* =========================
       FIND ROOT AGENT
    ========================= */
    const rootCommunityPartner = await CommunityPartnerProfile.findOne(
      { userId: communityPartnerUserId },
      null,
      { session }
    );

    if (!rootCommunityPartner) {
      throw new Error("RM Member not found");
    }

    /* =========================
       BFS OVER SUBTREE
    ========================= */
    const queue = [rootCommunityPartner._id];

    while (queue.length > 0) {
      const communityPartnerId = queue.shift();

      const community_partner = await CommunityPartnerProfile.findById(
        communityPartnerId,
        null,
        { session }
      );

      if (!community_partner) continue;

      // Update marketing community_partner
      await CommunityPartnerProfile.updateOne(
        { _id: community_partner._id },
        { blockCoordinatorId: blockCoordinatorUserId },
        { session }
      );

      // Push children into queue
      if (community_partner.childCommunityPartnerIds?.length > 0) {
        for (const childId of community_partner.childCommunityPartnerIds) {
          queue.push(childId);
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Marketing Executive updated for entire downline tree"
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    throw error;
  }
};


export const uploadCommunityPartnerAgreementService = async ({
  communityPartnerProfileId,
  uploadedByUserId,
  fileBuffer,
  mimeType,
  documentType // "AGREEMENT" | "LICENSE"
}) => {
  if (!communityPartnerProfileId || !uploadedByUserId || !fileBuffer || !documentType) {
    throw new Error("Missing required parameters");
  }

  // 1️⃣ Fetch community_partner profile
  const communityPartnerProfile = await CommunityPartnerProfile.findById(communityPartnerProfileId);

  if (!communityPartnerProfile) {
    throw new Error("RM Member profile not found");
  }

  // 2️⃣ Upload to S3 FIRST (no DB mutation yet)
  const uploadResult = await uploadAgreementToS3({
    userId: communityPartnerProfile.userId.toString(),
    documentType: documentType.toLowerCase(), // agreement | license
    fileBuffer,
    mimeType
  });

  // 3️⃣ Update agreement section (atomic document update)
  communityPartnerProfile.agreement = {
    documentType,
    document: {
      url: uploadResult.url,
      key: uploadResult.key
    },
    uploadedAt: new Date(),
    verificationStatus: "PENDING",
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: null
  };

  // 4️⃣ CommunityPartner must go inactive until approved
  communityPartnerProfile.status = "INACTIVE";

  await communityPartnerProfile.save();

  return {
    message: "Agreement uploaded successfully and pending verification",
    agreement: communityPartnerProfile.agreement
  };
};


//register community_partner by community_partner
export const registerCommunityPartnerByCommunityPartnerService = async ({
  parentCommunityPartnerUserId,
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
      pincode = null
    } = payload;

    validateCommunityPartnerPayload({ communityPartnerName, phone, latitude, longitude });

    /* =========================
       1. FIND PARENT AGENT
    ========================= */
    const parentCommunityPartner = await CommunityPartnerProfile.findOne({
      userId: parentCommunityPartnerUserId
    });

    if (!parentCommunityPartner) {
      throw new AppError("Parent RM Member profile not found", 404);
    }

    /* =========================
       2. FIND USER
    ========================= */
    let user = await User.findOne({ phone });

    if (
      user?.roles?.includes("block_coordinator") ||
      user?.roles?.includes("admin") ||
      user?.roles?.includes("subadmin")
    ) {
      throw new AppError(
        "You can't register this user because this is an existing employee",
        400
      );
    }

    /* =========================
       3. EXISTING AGENT PROFILE
    ========================= */
    if (user?.profiles?.communityPartnerId) {
      const existingCommunityPartner = await CommunityPartnerProfile.findById(
        user.profiles.communityPartnerId
      );

      if (!existingCommunityPartner) {
        throw new AppError("RM Member profile corrupted", 500);
      }

      if (existingCommunityPartner.parentCommunityPartnerId) {
        throw new AppError(
          "RM Member already belongs to a network. Contact admin for transfer.",
          400
        );
      }

      if (existingCommunityPartner.blockCoordinatorId) {
        throw new AppError(
          "RM Member already assigned to a Marketing Executive",
          400
        );
      }

      await CommunityPartnerProfile.updateOne(
        { _id: existingCommunityPartner._id },
        {
          $set: {
            parentCommunityPartnerId: parentCommunityPartner._id,
            blockCoordinatorId: parentCommunityPartner.blockCoordinatorId,
            level: parentCommunityPartner.level + 1,
            registeredBy: "AGENT",
            communityPartnerName,
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

      await CommunityPartnerProfile.updateOne(
        { _id: parentCommunityPartner._id },
        {
          $addToSet: { childCommunityPartnerIds: existingCommunityPartner._id },
          $inc: { directDownlineCount: 1 }
        }
      );

      return {
        userId: user._id,
        communityPartnerProfileId: existingCommunityPartner._id,
        message: "Existing RM Member linked under parent RM Member successfully"
      };
    }

    /* =========================
       4. CREATE USER IF NEEDED
    ========================= */
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

    /* =========================
       5. CREATE AGENT PROFILE
    ========================= */
    const communityPartnerProfile = await CommunityPartnerProfile.create({
      userId: user._id,
      parentCommunityPartnerId: parentCommunityPartner._id,
      blockCoordinatorId: parentCommunityPartner.blockCoordinatorId,
      level: parentCommunityPartner.level + 1,
      registeredBy: "AGENT",
      directDownlineCount: 0,
      totalDownlineCount: 0
    });

    /* =========================
       6. LINK PARENT → CHILD
    ========================= */
    await CommunityPartnerProfile.updateOne(
      { _id: parentCommunityPartner._id },
      {
        $addToSet: { childCommunityPartnerIds: communityPartnerProfile._id },
        $inc: { directDownlineCount: 1 }
      }
    );

    /* =========================
       7. RBAC UPDATE
    ========================= */
    const role = await ROLE.findOne({ key: "community_partner" })
      .select("permissions")
      .lean();

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          dashboard: "community_partner",
          roles: ["community_partner"], // fixed from "role" → "roles"
          permissions: role?.permissions || [],
          "profiles.communityPartnerId": communityPartnerProfile._id
        }
      }
    );

    return {
      userId: user._id,
      communityPartnerProfileId: communityPartnerProfile._id,
      message: "New RM Member registered under parent RM Member successfully"
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};



//view his network
export const getCommunityPartnerVisibleNetwork = async ({
  communityPartnerUserId
}) => {
  try {
    /* =========================
       1️⃣ FETCH SELF AGENT
    ========================= */
    const selfCommunityPartner = await CommunityPartnerProfile.findOne({
      userId: communityPartnerUserId
    })
      .populate({
        path: "userId",
        select: "name phone"
      })
      .lean();

    if (!selfCommunityPartner) {
      throw new AppError("RM Member profile not found", 404);
    }

    /* =========================
       2️⃣ FETCH PARENT AGENT (ONE LEVEL ONLY)
    ========================= */
    let parentCommunityPartner = null;

    if (selfCommunityPartner.parentCommunityPartnerId) {
      parentCommunityPartner = await CommunityPartnerProfile.findById(
        selfCommunityPartner.parentCommunityPartnerId
      )
        .populate({
          path: "userId",
          select: "name phone"
        })
        .lean();
    }

    /* =========================
       3️⃣ FETCH MARKETING AGENT (EMPLOYEE)
    ========================= */
    let blockCoordinator = null;

    if (selfCommunityPartner.blockCoordinatorId) {
      blockCoordinator = await User.findById(
        selfCommunityPartner.blockCoordinatorId
      )
        .select("name phone")
        .lean();
    }

    /* =========================
       4️⃣ FETCH ALL DOWNLINE AGENTS (ONCE)
    ========================= */
    const allCommunityPartners = await CommunityPartnerProfile.find({
      blockCoordinatorId: selfCommunityPartner.blockCoordinatorId
    })
      .populate({
        path: "userId",
        select: "name phone"
      })
      .lean();

    /* =========================
       5️⃣ BUILD MAP FOR BFS
    ========================= */
    const community_partnerMap = new Map();

    allCommunityPartners.forEach(community_partner => {
      community_partnerMap.set(community_partner._id.toString(), {
        id: community_partner._id,
        name: community_partner.userId?.name || "",
        phone: community_partner.userId?.phone || "",
        level: community_partner.level,
        children: []
      });
    });

    /* =========================
       6️⃣ BFS BUILD DOWNLINE TREE
    ========================= */
    const queue = [];
    const downlineTree = [];

    if (selfCommunityPartner.childCommunityPartnerIds?.length > 0) {
      selfCommunityPartner.childCommunityPartnerIds.forEach(childId => {
        const childNode = community_partnerMap.get(childId.toString());
        if (childNode) {
          downlineTree.push(childNode);
          queue.push(childId.toString());
        }
      });
    }

    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentCommunityPartner = allCommunityPartners.find(
        a => a._id.toString() === currentId
      );

      if (!currentCommunityPartner?.childCommunityPartnerIds?.length) continue;

      for (const childId of currentCommunityPartner.childCommunityPartnerIds) {
        const childNode = community_partnerMap.get(childId.toString());
        if (childNode) {
          community_partnerMap
            .get(currentId)
            .children.push(childNode);

          queue.push(childId.toString());
        }
      }
    }

    /* =========================
       7️⃣ RETURN VISIBLE NETWORK
    ========================= */
    return {
      success: true,
      data: {
        self: {
          id: selfCommunityPartner._id,
          name: selfCommunityPartner.userId?.name,
          phone: selfCommunityPartner.userId?.phone,
          level: selfCommunityPartner.level
        },

        parentCommunityPartner: parentCommunityPartner
          ? {
              id: parentCommunityPartner._id,
              name: parentCommunityPartner.userId?.name,
              phone: parentCommunityPartner.userId?.phone,
              level: parentCommunityPartner.level
            }
          : null,

        blockCoordinator: blockCoordinator
          ? {
              id: blockCoordinator._id,
              name: blockCoordinator.name,
              phone: blockCoordinator.phone
            }
          : null,

        downlineTree
      }
    };

  } catch (error) {
    console.error("getCommunityPartnerVisibleNetwork error:", error);
    throw error;
  }
};

export const registerCommunityPartnerByAdminService = async ({ payload }) => {
  const { communityPartnerName, phone, latitude, longitude, address = null, landmark = null, city = null, state = null, pincode = null, shopName = null, blockCoordinatorId = null, visitFrequency = 'MONTHLY' } = payload;
  validateCommunityPartnerPayload({ communityPartnerName, phone, latitude, longitude });

  let user = await User.findOne({ phone: phone.trim() });
  
  if (user?.roles?.includes('block_coordinator') || user?.roles?.includes('admin') || user?.roles?.includes('subadmin')) {
    throw new AppError('You cannot register this user as an RM Member because they are already an employee');
  }
  
  if (user?.roles?.length) {
    throw new AppError('This user already has roles: ' + user.roles.join(', '), 400);
  }
  
  if (user?.profiles?.communityPartnerId) {
    throw new AppError('User is already registered as an RM Member', 400);
  }
  
  if (!user) {
    user = await User.create({
      name: communityPartnerName.trim(),
      phone: phone.trim(),
      address,
      landmark,
      city,
      state,
      pincode,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      dashboard: 'community_partner',
      roles: ['community_partner'],
      isActive: true,
      kycStatus: 'none'
    });
  }
  
  const communityPartnerProfile = await CommunityPartnerProfile.create({
    userId: user._id,
    level: 0,
    directDownlineCount: 0,
    totalDownlineCount: 0,
    registeredBy: 'ADMIN',
    blockCoordinatorId: blockCoordinatorId || null,

    // Shop details drive the meet plan — see communityPartnerProfile.model.js
    shopName: shopName || communityPartnerName.trim(),
    address,
    landmark,
    city,
    state,
    pincode,
    visitFrequency: ['DAILY', 'WEEKLY', 'MONTHLY'].includes(String(visitFrequency).toUpperCase())
      ? String(visitFrequency).toUpperCase()
      : 'MONTHLY',
    location: { type: 'Point', coordinates: [longitude, latitude] }
  });

  const role = await ROLE.findOne({ key: 'community_partner' }).select('permissions').lean();
  
  await User.updateOne(
    { _id: user._id },
    { $set: { dashboard: 'community_partner', roles: ['community_partner'], permissions: role?.permissions || [], 'profiles.communityPartnerId': communityPartnerProfile._id } }
  );
  
  return { userId: user._id, communityPartnerProfileId: communityPartnerProfile._id, message: 'RM Member registered by admin successfully' };
};
