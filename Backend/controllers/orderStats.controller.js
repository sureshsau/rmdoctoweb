import {
  getOrdersByUserService,
  getCommunityPartnerDownlineOrderStatsService,
  getBlockCoordinatorNetworkOrderStatsService,
  getCommunityPartnerOrderAlertsService
} from "../services/orderStats.service.js";
import AppError from "../utils/AppError.js";

/**
 * ADMIN / SUBADMIN / MARKETING AGENT
 * GET /medicine/order/stats/community_partner-alerts?range=month&lowThreshold=5000
 *
 * Follow-up list of community_partners and what they ordered in the period, including
 * community_partners with no orders at all. Admin sees every community_partner; a marketing community_partner
 * sees only the community_partners assigned to them.
 */
export const getCommunityPartnerOrderAlertsController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];

    const isAdmin = roles.includes("admin") || roles.includes("subadmin");
    const isBlockCoordinator = roles.includes("block_coordinator");

    if (!isAdmin && !isBlockCoordinator) {
      throw new AppError("Forbidden: Admin or Marketing Executive only", 403);
    }

    const { range, from, to, lowThreshold } = req.query;

    const data = await getCommunityPartnerOrderAlertsService({
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
 * GET /medicine-orders/stats/community_partner/downline?range=month
 *
 * Returns total orders across the community_partner's entire downline tree (including self)
 * range: today | week | month | year | custom
 */
export const getCommunityPartnerDownlineOrderStatsController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];
    if (!roles.includes("community_partner")) {
      throw new AppError("Forbidden: RM Member only", 403);
    }

    const { range, from, to } = req.query;

    const data = await getCommunityPartnerDownlineOrderStatsService({
      communityPartnerUserId: req.user.id,
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
 * GET /medicine-orders/stats/marketing-community_partner/network?range=month
 *
 * Returns total orders placed by all community_partners assigned to this marketing community_partner
 * range: today | week | month | year | custom
 */
export const getBlockCoordinatorNetworkOrderStatsController = async (req, res, next) => {
  try {
    const roles = req.user.roles || [];
    if (!roles.includes("block_coordinator")) {
      throw new AppError("Forbidden: Marketing Executive only", 403);
    }

    const { range, from, to } = req.query;

    const data = await getBlockCoordinatorNetworkOrderStatsService({
      blockCoordinatorUserId: req.user.id,
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
