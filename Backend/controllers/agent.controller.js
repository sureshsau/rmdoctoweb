import AgentProfile from "../models/agentProfile.model.js";
import userModel from "../models/user.model.js";
import { getHierarchyByUserService, registerAgentByMarketingAgentService, uploadAgentAgreementService } from "../services/agent.service.js";

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
    const { roles, id } = req.user;
    const userId=id;
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
          message: "your profile still not created",
        });
      }

      // if (!agentProfile.marketingAgentId) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Marketing agent not assigned to this agent",
      //   });
      // }

      marketingAgentId = agentProfile.marketingAgentId || null;
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



export const uploadAgreementEnsureProfileController = async (req, res) => {
  try {
    const { userId, documentType } = req.body;
    const uploadedByUserId=req.user?.id;
    // 1️⃣ Basic validation
    if (!userId || !uploadedByUserId || !documentType) {
      return res.status(400).json({
        success: false,
        message: "userId, uploadedByUserId and documentType are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required"
      });
    }

    if (!["AGREEMENT", "LICENSE"].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid documentType"
      });
    }

    // 2️⃣ Fetch user
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exits"
      });
    }

    // 3️⃣ Role check (STRICT)
    if (!user.roles || !user.roles.includes("agent")) {
      return res.status(403).json({
        success: false,
        message: "User is not an agent"
      });
    }

    // 4️⃣ Find agent profile
    let agentProfile = await AgentProfile.findOne({ userId: user._id });

    // 5️⃣ Create profile if not exists
    if (!agentProfile) {
      agentProfile = await AgentProfile.create({
        userId: user._id,
        agentName: user.name,
        phone: user.phone,
        registeredBy: "admin", // or marketing_agent if needed
        status: "INACTIVE"
      });
    }

    // 6️⃣ Call SERVICE (single source of truth)
    const result = await uploadAgentAgreementService({
      agentProfileId: agentProfile._id,
      uploadedByUserId,
      documentType,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype
    });

    // 7️⃣ Response
    return res.status(200).json({
      success: true,
      agentProfileId: agentProfile._id,
      message: result.message,
      agreement: result.agreement
    });

  } catch (error) {
    console.error("❌ uploadAgreementEnsureProfileController:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Agreement upload failed"
    });
  }
};
