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
        role: ["agent"],
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
          role: ["agent"],
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
       FETCH ALL AGENTS
    ========================= */
    const agents = await AgentProfile.find({
      marketingAgentId: marketingAgentUserId
    })
      .populate({
        path: "userId",
        select: "name phone"
      })
      .lean();

    if (!agents.length) {
      return { success: true, tree: [] };
    }

    /* =========================
       MAP FOR O(1) LOOKUP
    ========================= */
    const agentMap = new Map();

    agents.forEach(agent => {
      agentMap.set(agent._id.toString(), {
        id: agent._id,
        name: agent.userId?.name || "",
        phone: agent.userId?.phone || "",
        level: agent.level,
        children: []
      });
    });

    /* =========================
       BUILD TREE
    ========================= */
    const roots = [];

    agents.forEach(agent => {
      const node = agentMap.get(agent._id.toString());

      if (agent.parentAgentId) {
        const parentNode = agentMap.get(
          agent.parentAgentId.toString()
        );

        if (parentNode) {
          parentNode.children.push(node);
        }
      } else {
        // no parent => root agent
        roots.push(node);
      }
    });

    return {
      success: true,
      tree: roots
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};
