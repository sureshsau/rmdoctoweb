import AgentProfile from "../models/agentProfile.model.js";
import { getHierarchyByUserService, registerAgentByMarketingAgentService } from "../services/agent.service.js";

export const getHierarchyController = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await getHierarchyByUserService({ userId });

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Hierarchy error:", error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


export const registerAgentController = async (req, res) => {
  try {
    const { dashboard, roles, id: id } = req.user;

    let marketingAgentId = null;

    // 🔹 If marketing agent himself is registering
    if (roles?.includes("marketing_agent")) {
      marketingAgentId = userId;
    }

    // 🔹 If agent is registering another agent (downline)
    else if (roles?.includes("agent")) {
      const agentProfile = await AgentProfile.findOne({ userId });

      if (!agentProfile) {
        return res.status(400).json({
          success: false,
          message: "Agent profile not found",
        });
      }

      if (!agentProfile.marketingAgentId) {
        return res.status(400).json({
          success: false,
          message: "Marketing agent not assigned to this agent",
        });
      }

      marketingAgentId = agentProfile.marketingAgentId;
    }

    // 🔹 Admin / subadmin case (optional)
    else if (roles?.includes("admin") || roles?.includes("subadmin")) {
      marketingAgentId = null;
    }

    // ❌ Unauthorized
    else {
      return res.status(403).json({
        success: false,
        message: "Not authorized to register agent",
      });
    }

    const result = await registerAgentByMarketingAgentService({
      marketingAgentId,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Agent registered successfully",
      data: result,
    });

  } catch (error) {
    console.error("❌ Agent registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

