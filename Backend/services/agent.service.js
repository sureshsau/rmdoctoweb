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



//only for admin 
export const assignMarketingAgentToAgent = async ({
  agentUserId,
  marketingAgentUserId
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* =========================
       FIND ROOT AGENT
    ========================= */
    const rootAgent = await AgentProfile.findOne(
      { userId: agentUserId },
      null,
      { session }
    );

    if (!rootAgent) {
      throw new Error("Agent not found");
    }

    /* =========================
       BFS OVER SUBTREE
    ========================= */
    const queue = [rootAgent._id];

    while (queue.length > 0) {
      const agentId = queue.shift();

      const agent = await AgentProfile.findById(
        agentId,
        null,
        { session }
      );

      if (!agent) continue;

      // Update marketing agent
      await AgentProfile.updateOne(
        { _id: agent._id },
        { marketingAgentId: marketingAgentUserId },
        { session }
      );

      // Push children into queue
      if (agent.childAgentIds?.length > 0) {
        for (const childId of agent.childAgentIds) {
          queue.push(childId);
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Marketing agent updated for entire downline tree"
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    throw error;
  }
};


export const uploadAgentAgreementService = async ({
  agentProfileId,
  uploadedByUserId,
  fileBuffer,
  mimeType,
  documentType // "AGREEMENT" | "LICENSE"
}) => {
  if (!agentProfileId || !uploadedByUserId || !fileBuffer || !documentType) {
    throw new Error("Missing required parameters");
  }

  // 1️⃣ Fetch agent profile
  const agentProfile = await AgentProfile.findById(agentProfileId);

  if (!agentProfile) {
    throw new Error("Agent profile not found");
  }

  // 2️⃣ Upload to S3 FIRST (no DB mutation yet)
  const uploadResult = await uploadAgreementToS3({
    userId: agentProfile.userId.toString(),
    documentType: documentType.toLowerCase(), // agreement | license
    fileBuffer,
    mimeType
  });

  // 3️⃣ Update agreement section (atomic document update)
  agentProfile.agreement = {
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

  // 4️⃣ Agent must go inactive until approved
  agentProfile.status = "INACTIVE";

  await agentProfile.save();

  return {
    message: "Agreement uploaded successfully and pending verification",
    agreement: agentProfile.agreement
  };
};


//register agent by agent
export const registerAgentByAgentService = async ({
  parentAgentUserId,
  payload
}) => {
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
      pincode = null
    } = payload;

    validateAgentPayload({ agentName, phone, latitude, longitude });

    /* =========================
       1. FIND PARENT AGENT
    ========================= */
    const parentAgent = await AgentProfile.findOne({
      userId: parentAgentUserId
    });

    if (!parentAgent) {
      throw new AppError("Parent agent profile not found", 404);
    }

    /* =========================
       2. FIND USER
    ========================= */
    let user = await User.findOne({ phone });

    /* =========================
       3. EXISTING AGENT PROFILE
    ========================= */
    if (user?.profiles?.agentId) {
      const existingAgent = await AgentProfile.findById(
        user.profiles.agentId
      );

      if (!existingAgent) {
        throw new AppError("Agent profile corrupted", 500);
      }

      // ❌ already belongs to a network
      if (existingAgent.parentAgentId) {
        throw new AppError(
          "Agent already belongs to a network. Contact admin for transfer.",
          400
        );
      }

      // ❌ already linked to marketing agent
      if (existingAgent.marketingAgentId) {
        throw new AppError(
          "Agent already assigned to a marketing agent",
          400
        );
      }

      //  SAFE TO LINK
      await AgentProfile.updateOne(
        { _id: existingAgent._id },
        {
          $set: {
            parentAgentId: parentAgent._id,
            marketingAgentId: parentAgent.marketingAgentId,
            level: parentAgent.level + 1,
            registeredBy: "AGENT",
           
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

      // ✅ PUSH INTO PARENT CHILDREN
      await AgentProfile.updateOne(
        { _id: parentAgent._id },
        {
          $addToSet: { childAgentIds: existingAgent._id },
          $inc: { directDownlineCount: 1 }
        }
      );

      return {
        userId: user._id,
        agentProfileId: existingAgent._id,
        message: "Existing agent linked under parent agent successfully"
      };
    }

    /* =========================
       4. CREATE USER IF NEEDED
    ========================= */
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
        dashboard: "agent",
        roles: ["agent"],
        permissions: [],
        isActive: true,
        isBlocked: false,
        passwordHash,
        kycStatus: "none"
      });
    }

    /* =========================
       5. CREATE AGENT PROFILE
    ========================= */
    const agentProfile = await AgentProfile.create({
      userId: user._id,
      parentAgentId: parentAgent._id,
      marketingAgentId: parentAgent.marketingAgentId,
      level: parentAgent.level + 1,
      registeredBy: "AGENT",
      directDownlineCount: 0,
      totalDownlineCount: 0
    });

    /* =========================
       6. LINK PARENT → CHILD
    ========================= */
    await AgentProfile.updateOne(
      { _id: parentAgent._id },
      {
        $addToSet: { childAgentIds: agentProfile._id },
        $inc: { directDownlineCount: 1 }
      }
    );

    /* =========================
       7. RBAC UPDATE
    ========================= */
    const role = await ROLE.findOne({ key: "agent" })
      .select("permissions")
      .lean();

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          dashboard: "agent",
          role: ["agent"],
          permissions: role?.permissions || [],
          "profiles.agentId": agentProfile._id
        }
      }
    );

    return {
      userId: user._id,
      agentProfileId: agentProfile._id,
      message: "New agent registered under parent agent successfully"
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};


//view his network
export const getAgentVisibleNetwork = async ({
  agentUserId
}) => {
  try {
    /* =========================
       1️⃣ FETCH SELF AGENT
    ========================= */
    const selfAgent = await AgentProfile.findOne({
      userId: agentUserId
    })
      .populate({
        path: "userId",
        select: "name phone"
      })
      .lean();

    if (!selfAgent) {
      throw new AppError("Agent profile not found", 404);
    }

    /* =========================
       2️⃣ FETCH PARENT AGENT (ONE LEVEL ONLY)
    ========================= */
    let parentAgent = null;

    if (selfAgent.parentAgentId) {
      parentAgent = await AgentProfile.findById(
        selfAgent.parentAgentId
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
    let marketingAgent = null;

    if (selfAgent.marketingAgentId) {
      marketingAgent = await User.findById(
        selfAgent.marketingAgentId
      )
        .select("name phone")
        .lean();
    }

    /* =========================
       4️⃣ FETCH ALL DOWNLINE AGENTS (ONCE)
    ========================= */
    const allAgents = await AgentProfile.find({
      marketingAgentId: selfAgent.marketingAgentId
    })
      .populate({
        path: "userId",
        select: "name phone"
      })
      .lean();

    /* =========================
       5️⃣ BUILD MAP FOR BFS
    ========================= */
    const agentMap = new Map();

    allAgents.forEach(agent => {
      agentMap.set(agent._id.toString(), {
        id: agent._id,
        name: agent.userId?.name || "",
        phone: agent.userId?.phone || "",
        level: agent.level,
        children: []
      });
    });

    /* =========================
       6️⃣ BFS BUILD DOWNLINE TREE
    ========================= */
    const queue = [];
    const downlineTree = [];

    if (selfAgent.childAgentIds?.length > 0) {
      selfAgent.childAgentIds.forEach(childId => {
        const childNode = agentMap.get(childId.toString());
        if (childNode) {
          downlineTree.push(childNode);
          queue.push(childId.toString());
        }
      });
    }

    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentAgent = allAgents.find(
        a => a._id.toString() === currentId
      );

      if (!currentAgent?.childAgentIds?.length) continue;

      for (const childId of currentAgent.childAgentIds) {
        const childNode = agentMap.get(childId.toString());
        if (childNode) {
          agentMap
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
          id: selfAgent._id,
          name: selfAgent.userId?.name,
          phone: selfAgent.userId?.phone,
          level: selfAgent.level
        },

        parentAgent: parentAgent
          ? {
              id: parentAgent._id,
              name: parentAgent.userId?.name,
              phone: parentAgent.userId?.phone,
              level: parentAgent.level
            }
          : null,

        marketingAgent: marketingAgent
          ? {
              id: marketingAgent._id,
              name: marketingAgent.name,
              phone: marketingAgent.phone
            }
          : null,

        downlineTree
      }
    };

  } catch (error) {
    console.error("getAgentVisibleNetwork error:", error);
    throw error;
  }
};
