import { getBlockCoordinatorTree, getOrdersForBlockCoordinatorService, registerCommunityPartnerByBlockCoordinatorService } from "../services/blockCoordinator.service.js";



export const registerCommunityPartnerByBlockCoordinatorController = async (req, res) => {
  try {
      const payload=req.body;
      const {id}=req.user;
      const data=await registerCommunityPartnerByBlockCoordinatorService({blockCoordinatorId:id,payload})

    return res.status(201).json({
      success: true,
      message: "RM Member registered successfully",
      data: data,
    });

  } catch (error) {
    console.error("❌ CommunityPartner registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


export const blockCoordinatorNetworkController = async (req, res) => {
  try {
    const { id } = req.user;

     const data = await getBlockCoordinatorTree({blockCoordinatorUserId:id});
   

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


export const getAssignedOrders = async (req, res, next) => {
  try {
    const blockCoordinatorUserId = req.user.id;

    const {
      status,
      page = 1,
      limit = 10
    } = req.query;

    const result = await getOrdersForBlockCoordinatorService({
      blockCoordinatorUserId,
      status,
      page: Number(page),
      limit: Number(limit)
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};






