import mongoose from "mongoose";

import AgentProfile from "../models/agentProfile.model.js";
import AgentVisit from "../models/agentVisit.model.js";
import MarketingAgentProfile from "../models/marketingAgentProfile.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { describePeriod, resolvePeriod } from "../utils/period.js";
import { uploadVisitPhotoToS3 } from "./aws.service.js";

const EARTH_RADIUS_M = 6371000;

/* Admin-side roles see every RM member; a marketing executive only sees the
   members allocated to them. */
const FULL_SCOPE_ROLES = ["admin", "subadmin", "employee"];

const oid = (v) => new mongoose.Types.ObjectId(String(v));

const isFullScope = (roles = []) => roles.some((r) => FULL_SCOPE_ROLES.includes(r));

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const roleTag = (roles = []) => {
  if (roles.includes("admin")) return "ADMIN";
  if (roles.includes("subadmin")) return "SUBADMIN";
  if (roles.includes("marketing_agent")) return "MARKETING_AGENT";
  return "EMPLOYEE";
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* ────────────────────────────────────────────────────────────────
   SHARED PIPELINE FRAGMENTS
──────────────────────────────────────────────────────────────── */

/* A shop's coordinates live on the agent profile once it has been captured
   at registration, but older members only have a location on their user
   account. Prefer the shop, fall back to the account. */
const EFFECTIVE_COORDS = {
  $cond: [
    { $gt: [{ $size: { $ifNull: ["$location.coordinates", []] } }, 0] },
    "$location.coordinates",
    { $ifNull: ["$user.location.coordinates", []] },
  ],
};

/* Great-circle distance in metres from a fixed centre to each member's shop.
   Done in the pipeline rather than with $geoNear so that members whose shop
   coordinates were never captured still fall back to their account location. */
const haversineFrom = (centreLng, centreLat) => ({
  $cond: [
    { $eq: [{ $size: "$effCoords" }, 2] },
    {
      $let: {
        vars: {
          lat1: { $degreesToRadians: centreLat },
          lat2: { $degreesToRadians: { $arrayElemAt: ["$effCoords", 1] } },
          dLat: {
            $degreesToRadians: {
              $subtract: [{ $arrayElemAt: ["$effCoords", 1] }, centreLat],
            },
          },
          dLng: {
            $degreesToRadians: {
              $subtract: [{ $arrayElemAt: ["$effCoords", 0] }, centreLng],
            },
          },
        },
        in: {
          $multiply: [
            2 * EARTH_RADIUS_M,
            {
              $asin: {
                $sqrt: {
                  $add: [
                    { $pow: [{ $sin: { $divide: ["$$dLat", 2] } }, 2] },
                    {
                      $multiply: [
                        { $cos: "$$lat1" },
                        { $cos: "$$lat2" },
                        { $pow: [{ $sin: { $divide: ["$$dLng", 2] } }, 2] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
    null,
  ],
});

/* Pulls every meet logged against the member inside the period, newest first,
   with the name of whoever logged it. */
const periodVisitsLookup = (from, to) => ({
  $lookup: {
    from: "agentvisits",
    let: { pid: "$_id" },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$agentProfileId", "$$pid"] },
              { $gte: ["$visitedAt", from] },
              { $lt: ["$visitedAt", to] },
            ],
          },
        },
      },
      { $sort: { visitedAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "visitedBy",
          foreignField: "_id",
          as: "by",
        },
      },
      {
        $project: {
          visitedAt: 1,
          status: 1,
          outcome: 1,
          notes: 1,
          address: 1,
          location: 1,
          distanceInMeters: 1,
          visitType: 1,
          visitedBy: 1,
          photo: "$photo.url",
          visitedByName: { $arrayElemAt: ["$by.name", 0] },
        },
      },
    ],
    as: "periodVisits",
  },
});

const DERIVE_STATUS = [
  {
    $addFields: {
      completedVisits: {
        $filter: {
          input: "$periodVisits",
          as: "v",
          cond: { $eq: ["$$v.status", "COMPLETED"] },
        },
      },
    },
  },
  {
    $addFields: {
      // A member is only "done" for the period once a meet is marked complete.
      // Attempts marked incomplete keep them on the pending list.
      visitStatus: {
        $cond: [
          { $gt: [{ $size: "$completedVisits" }, 0] },
          "COMPLETED",
          "PENDING",
        ],
      },
      attemptCount: { $size: "$periodVisits" },
      completedCount: { $size: "$completedVisits" },
      lastAttempt: { $arrayElemAt: ["$periodVisits", 0] },
      lastCompleted: { $arrayElemAt: ["$completedVisits", 0] },
    },
  },
];

const MEMBER_PROJECTION = {
  _id: 0,
  agentProfileId: "$_id",
  userId: "$user._id",
  name: "$user.name",
  phone: "$user.phone",
  avatar: "$user.faceImage.url",

  shopName: 1,
  shopImage: "$shopImage.url",

  address: { $ifNull: ["$address", "$user.address"] },
  landmark: { $ifNull: ["$landmark", "$user.landmark"] },
  city: { $ifNull: ["$city", "$user.city"] },
  state: { $ifNull: ["$state", "$user.state"] },
  pincode: { $ifNull: ["$pincode", "$user.pincode"] },

  coordinates: "$effCoords",

  visitFrequency: 1,
  level: 1,
  marketingAgentId: 1,
  lastVisitedAt: 1,

  visitStatus: 1,
  attemptCount: 1,
  completedCount: 1,
  lastAttempt: 1,
  lastCompleted: 1,
  distanceInMeters: 1,
};

/* ────────────────────────────────────────────────────────────────
   SCOPE
──────────────────────────────────────────────────────────────── */

const buildScope = ({ requester, marketingAgentId }) => {
  if (!isFullScope(requester.roles)) {
    // Marketing executive — hard-locked to their own allocation
    return { marketingAgentId: oid(requester.id) };
  }

  if (marketingAgentId && marketingAgentId !== "all") {
    if (marketingAgentId === "unassigned") return { marketingAgentId: null };
    if (!mongoose.isValidObjectId(marketingAgentId)) {
      throw new AppError("Invalid marketingAgentId", 400);
    }
    return { marketingAgentId: oid(marketingAgentId) };
  }

  return {};
};

/* ────────────────────────────────────────────────────────────────
   MEET PLAN — the list an admin / marketing executive works through
──────────────────────────────────────────────────────────────── */

export const getVisitPlanService = async ({
  requester,
  range = "day",
  from,
  to,
  status = "all",
  search,
  latitude,
  longitude,
  radiusKm,
  frequency,
  marketingAgentId,
  page = 1,
  limit = 20,
}) => {
  const period = resolvePeriod({ range, from, to });
  const scope = buildScope({ requester, marketingAgentId });

  const statusFilter = String(status || "all").toLowerCase();
  if (!["all", "pending", "completed"].includes(statusFilter)) {
    throw new AppError("status must be one of: all, pending, completed", 400);
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  const hasCentre = lat !== null && lng !== null;
  const radiusMeters = Math.max(0.1, Number(radiusKm) || 10) * 1000;

  const pipeline = [{ $match: scope }];

  if (frequency) {
    const f = String(frequency).toUpperCase();
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(f)) {
      throw new AppError("frequency must be DAILY, WEEKLY or MONTHLY", 400);
    }
    pipeline.push({ $match: { visitFrequency: f } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    // A blocked shop is not worth a trip
    { $match: { "user.isBlocked": { $ne: true } } },
    { $addFields: { effCoords: EFFECTIVE_COORDS } }
  );

  if (search) {
    const rx = new RegExp(escapeRegex(String(search).trim()), "i");
    pipeline.push({
      $match: {
        $or: [
          { shopName: rx },
          { address: rx },
          { landmark: rx },
          { city: rx },
          { state: rx },
          { pincode: rx },
          { "user.name": rx },
          { "user.phone": rx },
          { "user.address": rx },
          { "user.landmark": rx },
          { "user.city": rx },
          { "user.state": rx },
          { "user.pincode": rx },
        ],
      },
    });
  }

  if (hasCentre) {
    pipeline.push(
      { $addFields: { distanceInMeters: haversineFrom(lng, lat) } },
      {
        $match: {
          distanceInMeters: { $ne: null, $lte: radiusMeters },
        },
      }
    );
  } else {
    pipeline.push({ $addFields: { distanceInMeters: null } });
  }

  pipeline.push(periodVisitsLookup(period.from, period.to), ...DERIVE_STATUS);

  /* Route order when a centre is given — nearest shop first, so the whole
     list can be walked in one trip. Otherwise the member who has gone
     longest without a meet floats to the top (null sorts before dates). */
  const sortStage = hasCentre
    ? { $sort: { distanceInMeters: 1, _id: 1 } }
    : { $sort: { visitStatus: 1, lastVisitedAt: 1, _id: 1 } };

  const rowStages = [];
  if (statusFilter !== "all") {
    rowStages.push({
      $match: { visitStatus: statusFilter.toUpperCase() },
    });
  }
  rowStages.push(
    sortStage,
    { $skip: (safePage - 1) * safeLimit },
    { $limit: safeLimit },
    { $project: MEMBER_PROJECTION }
  );

  pipeline.push({
    $facet: {
      rows: rowStages,
      // Counted before the status filter so the tab badges always show totals
      counts: [{ $group: { _id: "$visitStatus", count: { $sum: 1 } } }],
    },
  });

  const [result] = await AgentProfile.aggregate(pipeline).allowDiskUse(true);

  const counts = result?.counts || [];
  const completed = counts.find((c) => c._id === "COMPLETED")?.count || 0;
  const pending = counts.find((c) => c._id === "PENDING")?.count || 0;
  const total = completed + pending;

  const shown = statusFilter === "pending"
    ? pending
    : statusFilter === "completed"
      ? completed
      : total;

  return {
    period: {
      range: period.range,
      from: period.from,
      to: period.to,
      label: describePeriod(period),
    },
    summary: {
      total,
      pending,
      completed,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    },
    filters: {
      status: statusFilter,
      search: search || null,
      frequency: frequency ? String(frequency).toUpperCase() : null,
      centre: hasCentre ? { latitude: lat, longitude: lng } : null,
      radiusKm: hasCentre ? radiusMeters / 1000 : null,
    },
    members: result?.rows || [],
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: shown,
      totalPages: Math.max(1, Math.ceil(shown / safeLimit)),
    },
  };
};

/* ────────────────────────────────────────────────────────────────
   LOCATION BUCKETS — "which routes still have shops to cover?"
──────────────────────────────────────────────────────────────── */

export const getVisitLocationsService = async ({
  requester,
  range = "day",
  from,
  to,
  marketingAgentId,
  search,
}) => {
  const period = resolvePeriod({ range, from, to });
  const scope = buildScope({ requester, marketingAgentId });

  const pipeline = [
    { $match: scope },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.isBlocked": { $ne: true } } },
    { $addFields: { effCoords: EFFECTIVE_COORDS } },
    periodVisitsLookup(period.from, period.to),
    ...DERIVE_STATUS,
    {
      $addFields: {
        routeCity: {
          $trim: { input: { $ifNull: ["$city", { $ifNull: ["$user.city", "Unknown"] }] } },
        },
        routePin: { $ifNull: ["$pincode", "$user.pincode"] },
      },
    },
  ];

  if (search) {
    const rx = new RegExp(escapeRegex(String(search).trim()), "i");
    pipeline.push({ $match: { $or: [{ routeCity: rx }, { routePin: rx }] } });
  }

  pipeline.push(
    {
      $group: {
        _id: { city: "$routeCity", pincode: "$routePin" },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$visitStatus", "COMPLETED"] }, 1, 0] },
        },
        // Centre of the cluster — good enough to seed a nearby search
        coords: { $push: "$effCoords" },
      },
    },
    {
      $project: {
        _id: 0,
        city: "$_id.city",
        pincode: "$_id.pincode",
        total: 1,
        completed: 1,
        pending: { $subtract: ["$total", "$completed"] },
        latitude: {
          $avg: {
            $map: {
              input: {
                $filter: {
                  input: "$coords",
                  as: "c",
                  cond: { $eq: [{ $size: "$$c" }, 2] },
                },
              },
              as: "c",
              in: { $arrayElemAt: ["$$c", 1] },
            },
          },
        },
        longitude: {
          $avg: {
            $map: {
              input: {
                $filter: {
                  input: "$coords",
                  as: "c",
                  cond: { $eq: [{ $size: "$$c" }, 2] },
                },
              },
              as: "c",
              in: { $arrayElemAt: ["$$c", 0] },
            },
          },
        },
      },
    },
    { $sort: { pending: -1, city: 1 } },
    { $limit: 100 }
  );

  const routes = await AgentProfile.aggregate(pipeline).allowDiskUse(true);

  return {
    period: {
      range: period.range,
      from: period.from,
      to: period.to,
      label: describePeriod(period),
    },
    routes,
  };
};

/* ────────────────────────────────────────────────────────────────
   TRACK — shop location + shop photo + meet history for one member
──────────────────────────────────────────────────────────────── */

export const getVisitTrackService = async ({
  requester,
  agentProfileId,
  range = "month",
  from,
  to,
}) => {
  if (!mongoose.isValidObjectId(agentProfileId)) {
    throw new AppError("Invalid RM Member id", 400);
  }

  const profile = await AgentProfile.findById(agentProfileId).lean();
  if (!profile) throw new AppError("RM Member not found", 404);

  assertCanTouchMember({ requester, profile });

  const [user, marketingAgent] = await Promise.all([
    User.findById(profile.userId)
      .select("name phone address landmark city state pincode location faceImage")
      .lean(),
    profile.marketingAgentId
      ? User.findById(profile.marketingAgentId).select("name phone").lean()
      : null,
  ]);

  const period = resolvePeriod({ range, from, to });

  const [periodVisits, recentVisits] = await Promise.all([
    AgentVisit.find({
      agentProfileId: profile._id,
      visitedAt: { $gte: period.from, $lt: period.to },
    })
      .sort({ visitedAt: -1 })
      .populate({ path: "visitedBy", select: "name phone" })
      .lean(),

    AgentVisit.find({ agentProfileId: profile._id })
      .sort({ visitedAt: -1 })
      .limit(20)
      .populate({ path: "visitedBy", select: "name phone" })
      .lean(),
  ]);

  const coordinates =
    profile.location?.coordinates?.length === 2
      ? profile.location.coordinates
      : user?.location?.coordinates?.length === 2
        ? user.location.coordinates
        : null;

  const shape = (v) => ({
    visitId: v._id,
    visitedAt: v.visitedAt,
    status: v.status,
    outcome: v.outcome,
    visitType: v.visitType,
    notes: v.notes,
    address: v.address,
    distanceInMeters: v.distanceInMeters,
    photo: v.photo?.url || null,
    coordinates: v.location?.coordinates || null,
    visitedBy: v.visitedBy
      ? { userId: v.visitedBy._id, name: v.visitedBy.name, phone: v.visitedBy.phone }
      : null,
  });

  return {
    member: {
      agentProfileId: profile._id,
      userId: profile.userId,
      name: user?.name || null,
      phone: user?.phone || null,
      avatar: user?.faceImage?.url || null,

      shopName: profile.shopName || null,
      shopImage: profile.shopImage?.url || null,

      address: profile.address || user?.address || null,
      landmark: profile.landmark || user?.landmark || null,
      city: profile.city || user?.city || null,
      state: profile.state || user?.state || null,
      pincode: profile.pincode || user?.pincode || null,

      coordinates,
      latitude: coordinates ? coordinates[1] : null,
      longitude: coordinates ? coordinates[0] : null,

      visitFrequency: profile.visitFrequency,
      lastVisitedAt: profile.lastVisitedAt,
      marketingAgent: marketingAgent
        ? { userId: marketingAgent._id, name: marketingAgent.name, phone: marketingAgent.phone }
        : null,
    },
    period: {
      range: period.range,
      from: period.from,
      to: period.to,
      label: describePeriod(period),
    },
    visitStatus: periodVisits.some((v) => v.status === "COMPLETED")
      ? "COMPLETED"
      : "PENDING",
    periodVisits: periodVisits.map(shape),
    recentVisits: recentVisits.map(shape),
  };
};

/* ────────────────────────────────────────────────────────────────
   MARK A MEET
──────────────────────────────────────────────────────────────── */

const assertCanTouchMember = ({ requester, profile }) => {
  if (isFullScope(requester.roles)) return;

  if (!requester.roles.includes("marketing_agent")) {
    throw new AppError("You are not allowed to manage RM Member meets", 403);
  }

  if (String(profile.marketingAgentId || "") !== String(requester.id)) {
    throw new AppError("This RM Member is not allocated to you", 403);
  }
};

const distanceBetween = (a, b) => {
  if (!a || !b || a.length !== 2 || b.length !== 2) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const [lng1, lat1] = a;
  const [lng2, lat2] = b;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)));
};

export const markVisitService = async ({
  requester,
  agentProfileId,
  payload = {},
  file = null,
}) => {
  if (!mongoose.isValidObjectId(agentProfileId)) {
    throw new AppError("Invalid RM Member id", 400);
  }

  const {
    status = "COMPLETED",
    outcome,
    notes = null,
    latitude,
    longitude,
    address = null,
    visitType = "CUSTOM",
    visitedAt,
  } = payload;

  const nextStatus = String(status).toUpperCase();
  if (!["COMPLETED", "INCOMPLETE"].includes(nextStatus)) {
    throw new AppError("status must be COMPLETED or INCOMPLETE", 400);
  }

  const nextType = String(visitType || "CUSTOM").toUpperCase();
  if (!["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(nextType)) {
    throw new AppError("visitType must be DAILY, WEEKLY, MONTHLY or CUSTOM", 400);
  }

  const profile = await AgentProfile.findById(agentProfileId).lean();
  if (!profile) throw new AppError("RM Member not found", 404);

  assertCanTouchMember({ requester, profile });

  const user = await User.findById(profile.userId).select("location").lean();

  const shopCoords =
    profile.location?.coordinates?.length === 2
      ? profile.location.coordinates
      : user?.location?.coordinates?.length === 2
        ? user.location.coordinates
        : null;

  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  const hereCoords = lat !== null && lng !== null ? [lng, lat] : null;

  const distanceInMeters = distanceBetween(shopCoords, hereCoords);

  let photo = undefined;
  if (file?.buffer) {
    photo = await uploadVisitPhotoToS3({
      agentProfileId: profile._id,
      imageBuffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname,
    });
  }

  const visit = await AgentVisit.create({
    agentProfileId: profile._id,
    agentUserId: profile.userId,
    visitedBy: requester.id,
    visitedByRole: roleTag(requester.roles),
    marketingAgentId: profile.marketingAgentId || null,
    visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
    status: nextStatus,
    outcome:
      outcome ||
      (nextStatus === "COMPLETED" ? "MET" : "OWNER_UNAVAILABLE"),
    visitType: nextType,
    location: hereCoords ? { type: "Point", coordinates: hereCoords } : undefined,
    address,
    distanceInMeters,
    notes,
    photo,
  });

  if (nextStatus === "COMPLETED") {
    await AgentProfile.updateOne(
      { _id: profile._id },
      { $set: { lastVisitedAt: visit.visitedAt } }
    );

    await bumpMarketingAgentCounters(profile.marketingAgentId, visit.visitedAt);
  }

  /* The executive's own radius rule — surfaced as a flag rather than a block
     so a genuine meet is never lost to a bad GPS fix. */
  const allowedRadius = await visitRadiusFor(requester);

  return {
    visitId: visit._id,
    agentProfileId: profile._id,
    status: visit.status,
    outcome: visit.outcome,
    visitedAt: visit.visitedAt,
    distanceInMeters,
    withinAllowedRadius:
      distanceInMeters === null ? null : distanceInMeters <= allowedRadius,
    allowedRadiusInMeters: allowedRadius,
    photo: visit.photo?.url || null,
  };
};

const visitRadiusFor = async (requester) => {
  if (isFullScope(requester.roles)) return Number.MAX_SAFE_INTEGER;

  const profile = await MarketingAgentProfile.findOne({ userId: requester.id })
    .select("visitRadiusInMeters")
    .lean();

  return profile?.visitRadiusInMeters || 100;
};

/* Keeps the executive's monthly snapshot honest without a nightly job. */
const bumpMarketingAgentCounters = async (marketingAgentUserId, visitedAt) => {
  if (!marketingAgentUserId) return;

  const monthKey = new Date(visitedAt).toISOString().slice(0, 7); // YYYY-MM

  const profile = await MarketingAgentProfile.findOne({
    userId: marketingAgentUserId,
  })
    .select("currentMonth")
    .lean();

  if (!profile) return;

  if (profile.currentMonth !== monthKey) {
    // New month — reset the snapshot before counting this meet
    await MarketingAgentProfile.updateOne(
      { userId: marketingAgentUserId },
      {
        $set: {
          currentMonth: monthKey,
          totalVisitsCompletedThisMonth: 1,
          lastVisitMarkedAt: visitedAt,
          lastActiveAt: new Date(),
        },
      }
    );
    return;
  }

  await MarketingAgentProfile.updateOne(
    { userId: marketingAgentUserId },
    {
      $inc: { totalVisitsCompletedThisMonth: 1 },
      $set: { lastVisitMarkedAt: visitedAt, lastActiveAt: new Date() },
    }
  );
};

/* ────────────────────────────────────────────────────────────────
   UNDO A MEET — un-ticking a row marked by mistake
──────────────────────────────────────────────────────────────── */

export const deleteVisitService = async ({ requester, visitId }) => {
  if (!mongoose.isValidObjectId(visitId)) {
    throw new AppError("Invalid visit id", 400);
  }

  const visit = await AgentVisit.findById(visitId);
  if (!visit) throw new AppError("Meet record not found", 404);

  const admin = isFullScope(requester.roles);

  if (!admin && String(visit.visitedBy) !== String(requester.id)) {
    throw new AppError("You can only undo a meet you marked yourself", 403);
  }

  await visit.deleteOne();

  /* lastVisitedAt is a cache of the newest completed meet — recompute it
     rather than leaving a timestamp for a record that no longer exists. */
  const newest = await AgentVisit.findOne({
    agentProfileId: visit.agentProfileId,
    status: "COMPLETED",
  })
    .sort({ visitedAt: -1 })
    .select("visitedAt")
    .lean();

  await AgentProfile.updateOne(
    { _id: visit.agentProfileId },
    { $set: { lastVisitedAt: newest?.visitedAt || null } }
  );

  if (visit.status === "COMPLETED" && visit.marketingAgentId) {
    const monthKey = new Date(visit.visitedAt).toISOString().slice(0, 7);
    await MarketingAgentProfile.updateOne(
      { userId: visit.marketingAgentId, currentMonth: monthKey },
      { $inc: { totalVisitsCompletedThisMonth: -1 } }
    );
  }

  return { visitId, agentProfileId: visit.agentProfileId };
};

/* ────────────────────────────────────────────────────────────────
   MEET SUMMARY — headline numbers for the dashboard tiles
──────────────────────────────────────────────────────────────── */

export const getVisitSummaryService = async ({
  requester,
  range = "day",
  from,
  to,
  marketingAgentId,
}) => {
  const period = resolvePeriod({ range, from, to });
  const scope = buildScope({ requester, marketingAgentId });

  const [result] = await AgentProfile.aggregate([
    { $match: scope },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.isBlocked": { $ne: true } } },
    periodVisitsLookup(period.from, period.to),
    ...DERIVE_STATUS,
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$visitStatus", "COMPLETED"] }, 1, 0] },
        },
        attempted: { $sum: { $cond: [{ $gt: ["$attemptCount", 0] }, 1, 0] } },
        neverVisited: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ["$lastVisitedAt", null] }, null] }, 1, 0] },
        },
      },
    },
  ]).allowDiskUse(true);

  const total = result?.total || 0;
  const completed = result?.completed || 0;

  return {
    period: {
      range: period.range,
      from: period.from,
      to: period.to,
      label: describePeriod(period),
    },
    total,
    completed,
    pending: total - completed,
    attempted: result?.attempted || 0,
    neverVisited: result?.neverVisited || 0,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
};

/* ────────────────────────────────────────────────────────────────
   SHOP DETAILS — photo + coordinates captured at registration
──────────────────────────────────────────────────────────────── */

export const updateShopDetailsService = async ({
  requester,
  agentProfileId,
  payload = {},
  file = null,
}) => {
  if (!mongoose.isValidObjectId(agentProfileId)) {
    throw new AppError("Invalid RM Member id", 400);
  }

  const profile = await AgentProfile.findById(agentProfileId).lean();
  if (!profile) throw new AppError("RM Member not found", 404);

  assertCanTouchMember({ requester, profile });

  const set = {};

  const passthrough = [
    "shopName",
    "address",
    "landmark",
    "city",
    "district",
    "state",
    "pincode",
  ];

  for (const key of passthrough) {
    if (payload[key] !== undefined) set[key] = payload[key] || null;
  }

  if (payload.visitFrequency !== undefined) {
    const f = String(payload.visitFrequency).toUpperCase();
    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(f)) {
      throw new AppError("visitFrequency must be DAILY, WEEKLY or MONTHLY", 400);
    }
    set.visitFrequency = f;
  }

  const lat = toNumber(payload.latitude);
  const lng = toNumber(payload.longitude);

  if (lat !== null && lng !== null) {
    set.location = { type: "Point", coordinates: [lng, lat] };
  }

  if (file?.buffer) {
    const uploaded = await uploadVisitPhotoToS3({
      agentProfileId: profile._id,
      imageBuffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname,
      folder: "shop",
    });

    set.shopImage = { ...uploaded, updatedAt: new Date() };
  }

  if (!Object.keys(set).length) {
    throw new AppError("Nothing to update", 400);
  }

  await AgentProfile.updateOne({ _id: profile._id }, { $set: set });

  return {
    agentProfileId: profile._id,
    shopName: set.shopName ?? profile.shopName ?? null,
    shopImage: set.shopImage?.url ?? profile.shopImage?.url ?? null,
    location: set.location ?? profile.location ?? null,
  };
};
