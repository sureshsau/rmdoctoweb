import {
  getOrdersByUserService,
  getAgentDownlineOrderStatsService,
  getMarketingAgentNetworkOrderStatsService,
  getAgentOrderAlertsService
} from "../services/orderStats.service.js";
import AppError from "../utils/AppError.js";

/**
 * ADMIN / SUBADMIN / MARKETING AGENT
 * GET /medicine/order/stats/agent-alerts?range=month&lowThreshold=5000
 *
 * Follow-up list of agents and what they ordered in the period, including
 * agents with no orders at all. Admin sees every agent; a marketing agent
 * sees only the agents assigned to them.
 */
export const getAgentOrderAlertsController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];

    const isAdmin = roles.includes("admin") || roles.includes("subadmin");
    const isMarketingAgent = roles.includes("marketing_agent");

    if (!isAdmin && !isMarketingAgent) {
      throw new AppError("Forbidden: Admin or Marketing Executive only", 403);
    }

    const { range, from, to, lowThreshold } = req.query;

    const data = await getAgentOrderAlertsService({
      // Admin wins when a user holds both roles — the wider view is the useful one
      scope: isAdmin ? "all" : "network",
      requesterId: req.user.id,
      range,
      from,
      to,
      lowThreshold: lowThreshold ?? undefined
    });

    return res.status(200).json({
      success: true,
      message: "RM Member order alerts fetched",
      rangeApplied: range || "all",
      ...data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN / SUBADMIN
 * GET /medicine-orders/stats/user/:userId?range=month
 * GET /medicine-orders/stats/user/:userId?range=custom&from=2026-01-01&to=2026-03-31
 *
 * range: today | week | month | year | custom
 */
export const getOrdersByUserController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];
    if (!roles.includes("admin") && !roles.includes("subadmin")) {
      throw new AppError("Forbidden: Admin or Subadmin only", 403);
    }

    const { userId } = req.params;
    const { range, from, to } = req.query;

    const data = await getOrdersByUserService({ targetUserId: userId, range, from, to });

    return res.status(200).json({
      success: true,
      message: "User medicine order stats fetched",
      rangeApplied: range || "all",
      ...data
    });
  } catch (err) {
    next(err);
  }
};


/**
 * AGENT
 * GET /medicine-orders/stats/agent/downline?range=month
 *
 * Returns total orders across the agent's entire downline tree (including self)
 * range: today | week | month | year | custom
 */
export const getAgentDownlineOrderStatsController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];
    if (!roles.includes("agent")) {
      throw new AppError("Forbidden: RM Member only", 403);
    }

    const { range, from, to } = req.query;

    const data = await getAgentDownlineOrderStatsService({
      agentUserId: req.user.id,
      range,
      from,
      to
    });

    return res.status(200).json({
      success: true,
      message: "RM Member downline order stats fetched",
      rangeApplied: range || "all",
      ...data
    });
  } catch (err) {
    next(err);
  }
};


/**
 * MARKETING AGENT
 * GET /medicine-orders/stats/marketing-agent/network?range=month
 *
 * Returns total orders placed by all agents assigned to this marketing agent
 * range: today | week | month | year | custom
 */
export const getMarketingAgentNetworkOrderStatsController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];
    if (!roles.includes("marketing_agent")) {
      throw new AppError("Forbidden: Marketing Executive only", 403);
    }

    const { range, from, to } = req.query;

    const data = await getMarketingAgentNetworkOrderStatsService({
      marketingAgentUserId: req.user.id,
      range,
      from,
      to
    });

    return res.status(200).json({
      success: true,
      message: "Marketing Executive network order stats fetched",
      rangeApplied: range || "all",
      ...data
    });
  } catch (err) {
    next(err);
  }
};
