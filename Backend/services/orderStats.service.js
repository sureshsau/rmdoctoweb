import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import CommunityPartnerProfile from "../models/communityPartnerProfile.model.js";
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
   Follow-up list for admin / marketing community_partner: every community_partner in
   scope with what they ordered in the period, so under-ordering
   community_partners can be called directly.
════════════════════════════════════════════════════════════ */

const DEFAULT_LOW_THRESHOLD = 5000;

/**
 * @param scope        "all" (admin/subadmin) or "network" (marketing community_partner)
 * @param requesterId  required when scope is "network"
 * @param lowThreshold order value below which an community_partner is flagged LOW
 */
export const getCommunityPartnerOrderAlertsService = async ({
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

  /* 1. Which community_partners are in scope? */
  const profileQuery = {};

  if (scope === "network") {
    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      throw new AppError("Invalid Marketing Executive id", 400);
    }
    profileQuery.blockCoordinatorId = new mongoose.Types.ObjectId(requesterId);
  }

  const communityPartnerProfiles = await CommunityPartnerProfile.find(profileQuery)
    .select("userId blockCoordinatorId level directDownlineCount totalDownlineCount lastVisitedAt")
    .lean();

  if (!communityPartnerProfiles.length) {
    return {
      scope,
      range: range || "all",
      lowThreshold: threshold,
      summary: { totalCommunityPartners: 0, noOrderCommunityPartners: 0, lowCommunityPartners: 0, activeCommunityPartners: 0, totalOrderValue: 0 },
      community_partners: []
    };
  }

  const communityPartnerUserIds = communityPartnerProfiles.map((p) => p.userId);

  /* 2. Order totals per community_partner for the period.
        Cancelled orders are excluded — they are not sales. */
  const dateFilter = buildDateRange({ range, from, to });

  const perCommunityPartner = await MedicineOrder.aggregate([
    {
      $match: {
        userId: { $in: communityPartnerUserIds },
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
    perCommunityPartner.map((s) => [s._id.toString(), s])
  );

  /* 3. Contact details — the point of the screen is calling these community_partners */
  const users = await User.find({ _id: { $in: communityPartnerUserIds } })
    .select("name phone address city district state pincode isActive isBlocked")
    .lean();

  const userById = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  /* 4. Merge — community_partners with no orders are kept, they matter most here */
  const community_partners = communityPartnerProfiles
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
        name: user.name || "Unnamed Community Partner",
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

  /* 5. Sort so the community_partners worth calling come first:
        no orders → low value (lowest first) → active (highest first) */
  const severity = { NO_ORDERS: 0, LOW: 1, ACTIVE: 2 };

  community_partners.sort((a, b) => {
    if (severity[a.alertLevel] !== severity[b.alertLevel]) {
      return severity[a.alertLevel] - severity[b.alertLevel];
    }
    if (a.alertLevel === "ACTIVE") return b.totalOrderValue - a.totalOrderValue;
    return a.totalOrderValue - b.totalOrderValue;
  });

  const summary = community_partners.reduce(
    (acc, a) => {
      acc.totalOrderValue += a.totalOrderValue;
      if (a.alertLevel === "NO_ORDERS") acc.noOrderCommunityPartners += 1;
      else if (a.alertLevel === "LOW") acc.lowCommunityPartners += 1;
      else acc.activeCommunityPartners += 1;
      return acc;
    },
    { totalCommunityPartners: community_partners.length, noOrderCommunityPartners: 0, lowCommunityPartners: 0, activeCommunityPartners: 0, totalOrderValue: 0 }
  );

  summary.totalOrderValue = Number(summary.totalOrderValue.toFixed(2));

  return {
    scope,
    range: range || "all",
    lowThreshold: threshold,
    summary,
    community_partners
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
export const getCommunityPartnerDownlineOrderStatsService = async ({ communityPartnerUserId, range, from, to }) => {
  if (!mongoose.Types.ObjectId.isValid(communityPartnerUserId)) {
    throw new AppError("Invalid communityPartnerUserId", 400);
  }

  // 1. Get all community_partners (self + downline) under this community_partner's subtree
  const selfProfile = await CommunityPartnerProfile.findOne({ userId: communityPartnerUserId }).lean();
  if (!selfProfile) throw new AppError("Community Partner profile not found", 404);

  // BFS to collect all community_partner userIds in the downline
  const allCommunityPartnerProfileIds = [selfProfile._id];
  const queue = [...selfProfile.childCommunityPartnerIds];

  while (queue.length > 0) {
    const batchIds = queue.splice(0, 50); // process in batches of 50
    const batch = await CommunityPartnerProfile.find({ _id: { $in: batchIds } })
      .select("_id userId childCommunityPartnerIds")
      .lean();

    for (const ap of batch) {
      allCommunityPartnerProfileIds.push(ap._id);
      if (ap.childCommunityPartnerIds?.length) queue.push(...ap.childCommunityPartnerIds);
    }
  }

  // 2. Get the user IDs for all these community_partner profiles
  const communityPartnerProfiles = await CommunityPartnerProfile.find({ _id: { $in: allCommunityPartnerProfileIds } })
    .select("userId")
    .lean();

  const allUserIds = communityPartnerProfiles.map(p => p.userId);

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

    // Per-community_partner breakdown
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

  const community_partnerBreakdown = perUserStats.map(s => ({
    userId: s._id,
    name: userMap[s._id.toString()]?.name || "Unknown",
    phone: userMap[s._id.toString()]?.phone || "",
    orderCount: s.orderCount,
    totalRevenue: s.totalRevenue
  }));

  return {
    downlineSize: allUserIds.length,
    summary,
    community_partnerBreakdown
  };
};


// ============================================================
// 3️⃣ MARKETING AGENT: Orders from entire assigned community_partner network
// ============================================================
export const getBlockCoordinatorNetworkOrderStatsService = async ({ blockCoordinatorUserId, range, from, to }) => {
  if (!mongoose.Types.ObjectId.isValid(blockCoordinatorUserId)) {
    throw new AppError("Invalid blockCoordinatorUserId", 400);
  }

  // All community_partners under this marketing community_partner (stored directly on CommunityPartnerProfile)
  const allCommunityPartnerProfiles = await CommunityPartnerProfile.find({
    blockCoordinatorId: new mongoose.Types.ObjectId(blockCoordinatorUserId)
  }).select("userId").lean();

  if (!allCommunityPartnerProfiles.length) {
    return {
      networkSize: 0,
      summary: { totalOrders: 0, totalRevenue: 0, delivered: 0, cancelled: 0, pending: 0 },
      community_partnerBreakdown: []
    };
  }

  const allUserIds = allCommunityPartnerProfiles.map(p => p.userId);

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

  const community_partnerBreakdown = perUserStats.map(s => ({
    userId: s._id,
    name: userMap[s._id.toString()]?.name || "Unknown",
    phone: userMap[s._id.toString()]?.phone || "",
    orderCount: s.orderCount,
    totalRevenue: s.totalRevenue
  }));

  return {
    networkSize: allUserIds.length,
    summary,
    community_partnerBreakdown
  };
};
