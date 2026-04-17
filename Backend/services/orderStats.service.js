import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import AgentProfile from "../models/agentProfile.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";

/**
 * Build a date range filter object for MongoDB queries.
 * Accepts: today | week | month | year | custom (requires from & to)
 * Falls back to all time if no range given.
 */
export const buildDateRange = ({ range, from, to }) => {
  const now = new Date();
  let startDate, endDate;

  switch (range) {
    case "today": {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
      break;
    }
    case "week": {
      const day = now.getDay(); // 0=Sun
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      startDate = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
      endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
      break;
    }
    case "month": {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
      break;
    }
    case "year": {
      startDate = new Date(Date.UTC(now.getFullYear(), 0, 1));
      endDate = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999));
      break;
    }
    case "custom": {
      if (!from || !to) throw new AppError("'from' and 'to' are required for custom range", 400);
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setUTCHours(23, 59, 59, 999);
      if (isNaN(startDate) || isNaN(endDate)) throw new AppError("Invalid date format", 400);
      break;
    }
    default:
      return {}; // No filter — all time
  }

  return { $gte: startDate, $lte: endDate };
};


// ============================================================
// 1️⃣ ADMIN: Orders by a specific user
// ============================================================
export const getOrdersByUserService = async ({ targetUserId, range, from, to }) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError("Invalid userId", 400);
  }

  const dateFilter = buildDateRange({ range, from, to });
  const query = {
    userId: new mongoose.Types.ObjectId(targetUserId),
    ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
  };

  const [orders, stats] = await Promise.all([
    MedicineOrder.find(query)
      .sort({ createdAt: -1 })
      .select("orderStatus paymentStatus paymentMode pricing.payableAmount createdAt")
      .lean(),

    MedicineOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.payableAmount" },
          delivered: { $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$orderStatus", ["INITIATED", "CONFIRMED", "SHIPPED"]] }, 1, 0] } }
        }
      }
    ])
  ]);

  const summary = stats[0] || { totalOrders: 0, totalRevenue: 0, delivered: 0, cancelled: 0, pending: 0 };
  delete summary._id;

  return { summary, orders };
};


// ============================================================
// 2️⃣ AGENT: Orders from entire downline tree
// ============================================================
export const getAgentDownlineOrderStatsService = async ({ agentUserId, range, from, to }) => {
  if (!mongoose.Types.ObjectId.isValid(agentUserId)) {
    throw new AppError("Invalid agentUserId", 400);
  }

  // 1. Get all agents (self + downline) under this agent's subtree
  const selfProfile = await AgentProfile.findOne({ userId: agentUserId }).lean();
  if (!selfProfile) throw new AppError("Agent profile not found", 404);

  // BFS to collect all agent userIds in the downline
  const allAgentProfileIds = [selfProfile._id];
  const queue = [...selfProfile.childAgentIds];

  while (queue.length > 0) {
    const batchIds = queue.splice(0, 50); // process in batches of 50
    const batch = await AgentProfile.find({ _id: { $in: batchIds } })
      .select("_id userId childAgentIds")
      .lean();

    for (const ap of batch) {
      allAgentProfileIds.push(ap._id);
      if (ap.childAgentIds?.length) queue.push(...ap.childAgentIds);
    }
  }

  // 2. Get the user IDs for all these agent profiles
  const agentProfiles = await AgentProfile.find({ _id: { $in: allAgentProfileIds } })
    .select("userId")
    .lean();

  const allUserIds = agentProfiles.map(p => p.userId);

  const dateFilter = buildDateRange({ range, from, to });
  const query = {
    userId: { $in: allUserIds },
    ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
  };

  // 3. Aggregate stats
  const [stats, perUserStats] = await Promise.all([
    MedicineOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.payableAmount" },
          delivered: { $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$orderStatus", ["INITIATED", "CONFIRMED", "SHIPPED"]] }, 1, 0] } }
        }
      }
    ]),

    // Per-agent breakdown
    MedicineOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.payableAmount" }
        }
      }
    ])
  ]);

  const summary = stats[0] || { totalOrders: 0, totalRevenue: 0, delivered: 0, cancelled: 0, pending: 0 };
  delete summary._id;

  // Enrich per-user data with names
  const userIds = perUserStats.map(s => s._id);
  const users = await User.find({ _id: { $in: userIds } }).select("name phone").lean();
  const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

  const agentBreakdown = perUserStats.map(s => ({
    userId: s._id,
    name: userMap[s._id.toString()]?.name || "Unknown",
    phone: userMap[s._id.toString()]?.phone || "",
    orderCount: s.orderCount,
    totalRevenue: s.totalRevenue
  }));

  return {
    downlineSize: allUserIds.length,
    summary,
    agentBreakdown
  };
};


// ============================================================
// 3️⃣ MARKETING AGENT: Orders from entire assigned agent network
// ============================================================
export const getMarketingAgentNetworkOrderStatsService = async ({ marketingAgentUserId, range, from, to }) => {
  if (!mongoose.Types.ObjectId.isValid(marketingAgentUserId)) {
    throw new AppError("Invalid marketingAgentUserId", 400);
  }

  // All agents under this marketing agent (stored directly on AgentProfile)
  const allAgentProfiles = await AgentProfile.find({
    marketingAgentId: new mongoose.Types.ObjectId(marketingAgentUserId)
  }).select("userId").lean();

  if (!allAgentProfiles.length) {
    return {
      networkSize: 0,
      summary: { totalOrders: 0, totalRevenue: 0, delivered: 0, cancelled: 0, pending: 0 },
      agentBreakdown: []
    };
  }

  const allUserIds = allAgentProfiles.map(p => p.userId);

  const dateFilter = buildDateRange({ range, from, to });
  const query = {
    userId: { $in: allUserIds },
    ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
  };

  const [stats, perUserStats] = await Promise.all([
    MedicineOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.payableAmount" },
          delivered: { $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$orderStatus", ["INITIATED", "CONFIRMED", "SHIPPED"]] }, 1, 0] } }
        }
      }
    ]),

    MedicineOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.payableAmount" }
        }
      }
    ])
  ]);

  const summary = stats[0] || { totalOrders: 0, totalRevenue: 0, delivered: 0, cancelled: 0, pending: 0 };
  delete summary._id;

  const userIds = perUserStats.map(s => s._id);
  const users = await User.find({ _id: { $in: userIds } }).select("name phone").lean();
  const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

  const agentBreakdown = perUserStats.map(s => ({
    userId: s._id,
    name: userMap[s._id.toString()]?.name || "Unknown",
    phone: userMap[s._id.toString()]?.phone || "",
    orderCount: s.orderCount,
    totalRevenue: s.totalRevenue
  }));

  return {
    networkSize: allUserIds.length,
    summary,
    agentBreakdown
  };
};
