import { getMarketingAgentTree, getOrdersForMarketingAgentService, registerAgentByMarketingAgentService, updateOrderStatusService } from "../services/marketingAgent.service.js";



export const registerAgentByMarketingAgentController = async (req, res) => {
  try {
      const payload=req.body;
      const {id}=req.user;
      const data=await registerAgentByMarketingAgentService({marketingAgentId:id,payload})

    return res.status(201).json({
      success: true,
      message: "Agent registered successfully",
      data: data,
    });

  } catch (error) {
    console.error("❌ Agent registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


export const marketingAgentNetworkController = async (req, res) => {
  try {
    const { id } = req.user;

     const data = await getMarketingAgentTree({marketingAgentUserId:id});
   

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
    const marketingAgentUserId = req.user.id;

    const {
      status,
      page = 1,
      limit = 10
    } = req.query;

    const result = await getOrdersForMarketingAgentService({
      marketingAgentUserId,
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

export const updateOrderStatusController = async (req, res, next) => {
  try {
    const marketingAgentUserId = req.user.id;
    const { orderId } = req.params;
    const { status, cancelReason } = req.body;

    const updatedOrder = await updateOrderStatusService({
      orderId,
      newStatus: status,
      marketingAgentUserId,
      cancelReason
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: {
        id: updatedOrder._id,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus
      }
    });
  } catch (error) {
    next(error);
  }
};



