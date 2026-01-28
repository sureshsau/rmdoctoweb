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
    const { userType } = req.user;
    
    const marketingAgentId=null;
    if (userType == "marketing_agent") {
       marketingAgentId=user.id;
    }else if(userType=="agent"){
        const agentProfile=await AgentProfile.findOne({userId:req.user.id});
        if(!agentProfile){
            return res.status(400).json({
            success: false,
            message: "agent profile is not created"
            });
        }
        marketingAgentId=agentProfile.marketingAgentId;
    }else{
        marketingAgentId=null
    }
    const result = await registerAgentByMarketingAgentService({
        marketingAgentId: req.user.id,
        payload: req.body
      });

  } catch (error) {
    console.error("❌ Agent registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};
