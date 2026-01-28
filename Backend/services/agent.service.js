import mongoose from "mongoose";
import User from "../models/user.model.js";
import AgentProfile from "../models/agentProfile.model.js";
import ROLE from "../models/role.model.js";
import RoleAssignment from '../models/roleAssignment.model.js'
import { hashPassword } from "../utils/password.js";


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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      agentName,
      phone,
      password, // ✅ password from frontend

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
    let user = await User.findOne({ phone }).session(session);

    // 🔍 2. If agent profile already exists
    if (user?.profiles?.agentId) {
      const existingAgentProfile = await AgentProfile
        .findById(user.profiles.agentId)
        .session(session);

      if (existingAgentProfile) {
        if (existingAgentProfile.marketingAgentId) {
          throw new Error("Agent is already allocated to a marketing agent");
        }

        // Assign if unallocated
        await AgentProfile.updateOne(
          { _id: existingAgentProfile._id },
          {
            $set: {
              marketingAgentId,
              registeredBy: "MARKETING_AGENT",
              status: "INACTIVE",
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
          },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

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
      const parentAgent = await AgentProfile
        .findById(parentAgentId)
        .session(session);

      if (!parentAgent) {
        throw new Error("Parent agent not found");
      }

      level = parentAgent.level + 1;
    }

    // 🔹 3. Create user if not exists
    if (!user) {
      const passwordHash = await hashPassword(password);

      const users = await User.create(
        [
          {
            name: agentName,
            phone,
            userType: "agent",
            isActive: false,
            isBlocked: false,
            passwordHash,
            kycStatus: "none"
          }
        ],
        { session }
      );

      user = users[0];
    }

    // 🔹 4. Create agent profile
    const agentProfiles = await AgentProfile.create(
      [
        {
          userId: user._id,
          agentName,
          phone,
          address,
          city,
          state,
          pincode,
          location: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          parentAgentId,
          level,
          directDownlineCount: 0,
          totalDownlineCount: 0,
          marketingAgentId,
          status: "INACTIVE",
          registeredBy: "MARKETING_AGENT"
        }
      ],
      { session }
    );

    const agentProfileId = agentProfiles[0]._id;

    // 🔗 5. Link agent profile to user
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          "profiles.agentId": agentProfileId,
          userType: "agent"
        }
      },
      { session }
    );

    // 🔐 6. RBAC ASSIGNMENT (FIXED)
    const role = await ROLE.findOne({ key: "agent" }).session(session);
    if (!role) {
      throw new Error("Agent role not found");
    }

    const existingAssignment = await RoleAssignment.findOne({
      userId: user._id,
      roleId: role._id,
      scope: "GLOBAL",
      scopeId: null,
      active: true
    }).session(session);

    if (!existingAssignment) {
      await RoleAssignment.create(
        [
          {
            userId: user._id,
            roleId: role._id,
            scope: "GLOBAL",
            scopeId: null,
            grantedBy: marketingAgentId,
            active: true
          }
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      userId: user._id,
      agentProfileId,
      message: "New agent registered successfully"
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};



export const getHierarchyByUserService = async ({ userId }) => {
  // 1️⃣ Fetch user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // ==========================
  // CASE A: USER IS AGENT
  // ==========================
  if (user.userType === "agent") {
    const agentProfileId = user.profiles?.agentId;
    if (!agentProfileId) {
      throw new Error("Agent profile not found");
    }

    return await buildAgentDownline(agentProfileId);
  }

  // ==========================
  // CASE B: USER IS MARKETING AGENT
  // ==========================
  if (user.userType === "marketing_agent") {
    return await buildMarketingAgentHierarchy(user._id);
  }

  throw new Error("Hierarchy not available for this user type");
};
const buildMarketingAgentHierarchy = async (marketingAgentId) => {
  // 1️⃣ Fetch all agents under this marketing agent
  const agents = await AgentProfile.find({
    marketingAgentId
  }).lean();

  if (!agents.length) {
    return {
      type: "MARKETING_AGENT",
      totalAgents: 0,
      roots: [],
      agents: []
    };
  }

  // 2️⃣ Build in-memory tree
  const map = {};
  agents.forEach(a => {
    map[a._id.toString()] = { ...a, children: [] };
  });

  const roots = [];

  agents.forEach(agent => {
    if (
      agent.parentAgentId &&
      map[agent.parentAgentId.toString()]
    ) {
      map[agent.parentAgentId.toString()].children.push(
        map[agent._id.toString()]
      );
    } else {
      // root agent for this marketing agent
      roots.push(map[agent._id.toString()]);
    }
  });

  return {
    type: "MARKETING_AGENT",
    totalAgents: agents.length,
    roots,
    agents
  };
};
const buildAgentDownline = async (agentProfileId) => {
  const result = await AgentProfile.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(agentProfileId) }
    },
    {
      $graphLookup: {
        from: "agentprofiles",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentAgentId",
        as: "downline",
        depthField: "level"
      }
    }
  ]);

  if (!result.length) {
    throw new Error("Agent hierarchy not found");
  }

  return {
    type: "AGENT",
    rootAgentId: result[0]._id,
    totalAgents: result[0].downline.length,
    agents: result[0].downline
  };
};
