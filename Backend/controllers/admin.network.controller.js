import { getAgentVisibleNetwork } from "../services/agent.service.js";
import { getMarketingAgentTree } from "../services/marketingAgent.service.js";
import User from "../models/user.model.js";

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/agent/:userId
   Admin views any specific Agent's full network tree
────────────────────────────────────────────────────────────── */
export const adminGetAgentNetworkController = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await getAgentVisibleNetwork({ agentUserId: userId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("adminGetAgentNetworkController error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/marketing-agent/:userId
   Admin views any specific Marketing Agent's full tree
────────────────────────────────────────────────────────────── */
export const adminGetMarketingAgentNetworkController = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await getMarketingAgentTree({ marketingAgentUserId: userId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("adminGetMarketingAgentNetworkController error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/agents
   Admin gets a list of all root agents (level 0, no parent)
   for quick selection in the pick list
────────────────────────────────────────────────────────────── */
export const adminGetAllAgentsController = async (req, res) => {
  try {
    const agents = await User.find({
      roles: { $in: ["agent"] },
    })
      .select("_id name phone faceImage isActive")
      .lean();

    return res.status(200).json({
      success: true,
      data: agents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/marketing-agents
   Admin gets a list of all marketing agents for the pick list
────────────────────────────────────────────────────────────── */
export const adminGetAllMarketingAgentsController = async (req, res) => {
  try {
    const agents = await User.find({
      roles: { $in: ["marketing_agent"] },
    })
      .select("_id name phone faceImage isActive")
      .lean();

    return res.status(200).json({
      success: true,
      data: agents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
