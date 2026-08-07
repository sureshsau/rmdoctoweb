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


/* ════════════════════════════════════════════════════════════
   AGENT ORDER ALERTS
   Follow-up list for admin / marketing agent: every agent in
   scope with what they ordered in the period, so under-ordering
   agents can be called directly.
════════════════════════════════════════════════════════════ */

const DEFAULT_LOW_THRESHOLD = 5000;

/**
 * @param scope        "all" (admin/subadmin) or "network" (marketing agent)
 * @param requesterId  required when scope is "network"
 * @param lowThreshold order value below which an agent is flagged LOW
 */
export const getAgentOrderAlertsService = async ({
  scope,
  requesterId,
  range,
  from,
  to,
  lowThreshold = DEFAULT_LOW_THRESHOLD
}) => {
  const threshold = Number(lowThreshold);
  if (Number.isNaN(threshold) || threshold < 0) {
    throw new AppError("lowThreshold must be a non-negative number", 400);
  }

  /* 1. Which agents are in scope? */
  const profileQuery = {};

  if (scope === "network") {
    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      throw new AppError("Invalid Marketing Executive id", 400);
    }
    profileQuery.marketingAgentId = new mongoose.Types.ObjectId(requesterId);
  }

  const agentProfiles = await AgentProfile.find(profileQuery)
    .select("userId marketingAgentId level directDownlineCount totalDownlineCount lastVisitedAt")
    .lean();

  if (!agentProfiles.length) {
    return {
      scope,
      range: range || "all",
      lowThreshold: threshold,
      summary: { totalAgents: 0, noOrderAgents: 0, lowAgents: 0, activeAgents: 0, totalOrderValue: 0 },
      agents: []
    };
  }

  const agentUserIds = agentProfiles.map((p) => p.userId);

  /* 2. Order totals per agent for the period.
        Cancelled orders are excluded — they are not sales. */
  const dateFilter = buildDateRange({ range, from, to });

  const perAgent = await MedicineOrder.aggregate([
    {
      $match: {
        userId: { $in: agentUserIds },
        orderStatus: { $ne: "CANCELLED" },
        ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
      }
    },
    {
      $group: {
        _id: "$userId",
        orderCount: { $sum: 1 },
        totalOrderValue: { $sum: "$pricing.payableAmount" },
        lastOrderAt: { $max: "$createdAt" }
      }
    }
  ]);

  const statsByUser = Object.fromEntries(
    perAgent.map((s) => [s._id.toString(), s])
  );

  /* 3. Contact details — the point of the screen is calling these agents */
  const users = await User.find({ _id: { $in: agentUserIds } })
    .select("name phone address city district state pincode isActive isBlocked")
    .lean();

  const userById = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  /* 4. Merge — agents with no orders are kept, they matter most here */
  const agents = agentProfiles
    .map((profile) => {
      const key = profile.userId.toString();
      const user = userById[key];
      if (!user) return null; // orphaned profile

      const stats = statsByUser[key];
      const orderCount = stats?.orderCount || 0;
      const totalOrderValue = Number((stats?.totalOrderValue || 0).toFixed(2));

      let alertLevel;
      if (orderCount === 0) alertLevel = "NO_ORDERS";
      else if (totalOrderValue < threshold) alertLevel = "LOW";
      else alertLevel = "ACTIVE";

      return {
        userId: user._id,
        name: user.name || "Unnamed RM Member",
        phone: user.phone || null,
        address:
          [user.address, user.city, user.district, user.state, user.pincode]
            .filter(Boolean)
            .join(", ") || null,
        isActive: user.isActive !== false && !user.isBlocked,
        level: profile.level ?? 0,
        directDownlineCount: profile.directDownlineCount || 0,
        lastVisitedAt: profile.lastVisitedAt || null,
        orderCount,
        totalOrderValue,
        lastOrderAt: stats?.lastOrderAt || null,
        alertLevel
      };
    })
    .filter(Boolean);

  /* 5. Sort so the agents worth calling come first:
        no orders → low value (lowest first) → active (highest first) */
  const severity = { NO_ORDERS: 0, LOW: 1, ACTIVE: 2 };

  agents.sort((a, b) => {
    if (severity[a.alertLevel] !== severity[b.alertLevel]) {
      return severity[a.alertLevel] - severity[b.alertLevel];
    }
    if (a.alertLevel === "ACTIVE") return b.totalOrderValue - a.totalOrderValue;
    return a.totalOrderValue - b.totalOrderValue;
  });

  const summary = agents.reduce(
    (acc, a) => {
      acc.totalOrderValue += a.totalOrderValue;
      if (a.alertLevel === "NO_ORDERS") acc.noOrderAgents += 1;
      else if (a.alertLevel === "LOW") acc.lowAgents += 1;
      else acc.activeAgents += 1;
      return acc;
    },
    { totalAgents: agents.length, noOrderAgents: 0, lowAgents: 0, activeAgents: 0, totalOrderValue: 0 }
  );

  summary.totalOrderValue = Number(summary.totalOrderValue.toFixed(2));

  return {
    scope,
    range: range || "all",
    lowThreshold: threshold,
    summary,
    agents
  };
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
  if (!selfProfile) throw new AppError("RM Member profile not found", 404);

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
