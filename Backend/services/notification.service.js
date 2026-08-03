import mongoose from "mongoose";

import { Notification } from "../models/notification.model.js";
import { NotificationBroadcast } from "../models/notificationBroadcast.model.js";
import USER from "../models/user.model.js";
import { io } from "../sockets/socket.js";
import { sendPushToUsers } from "./push.service.js";
import AppError from "../utils/AppError.js";

/* ================= CONSTANTS ================= */

// Roles an admin is allowed to target. Mirrors the dashboard enum on the User
// model minus "admin" duplicates — kept explicit so a typo in a request body
// can never fan a push out to an unintended audience.
export const TARGETABLE_ROLES = [
  "admin",
  "subadmin",
  "doctor",
  "receptionist",
  "employee",
  "agent",
  "marketing_agent",
  "rmrider",
  "user",
];

const AUDIENCES = ["ALL", "ROLES", "USERS"];

const SEVERITIES = ["info", "warning", "critical"];

// insertMany batch size for the fan-out write.
const CHUNK_SIZE = 1000;

/* ================= HELPERS ================= */

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

/**
 * Emit a realtime event into a user's private socket room. Delivery is
 * best-effort: a user with no socket connected simply picks the notification up
 * from the DB on their next fetch, so a socket failure must never fail the push.
 */
const emitToUser = (userId, event, data) => {
  try {
    io?.to(`user:${String(userId)}`).emit(event, data);
  } catch (err) {
    console.error("Socket emit failed:", err?.message);
  }
};

/**
 * Resolve an audience descriptor into the list of user _ids that should receive
 * a copy. Only active, unblocked users are ever included.
 */
const resolveRecipients = async ({ audience, roles = [], userIds = [] }) => {
  const baseFilter = { isActive: true, isBlocked: false };

  if (audience === "ALL") {
    const users = await USER.find(baseFilter).select("_id").lean();
    return users.map((u) => u._id);
  }

  if (audience === "ROLES") {
    // A user's role can live in either `roles[]` (RBAC) or `dashboard` (UI
    // routing). Older accounts often have only one of the two set, so match on
    // both to avoid silently skipping people.
    const users = await USER.find({
      ...baseFilter,
      $or: [{ roles: { $in: roles } }, { dashboard: { $in: roles } }],
    })
      .select("_id")
      .lean();
    return users.map((u) => u._id);
  }

  // audience === "USERS" — verify the ids actually exist and are active.
  const users = await USER.find({ ...baseFilter, _id: { $in: userIds } })
    .select("_id")
    .lean();
  return users.map((u) => u._id);
};

/* ================= ADMIN: SEND ================= */

/**
 * Push a notification from the admin panel to every user in the target
 * audience. Writes one Notification per recipient (fan-out on write) plus a
 * single NotificationBroadcast record for the admin's history.
 */
export const sendBroadcast = async ({
  title,
  message,
  severity = "info",
  audience,
  roles = [],
  userIds = [],
  sentBy,
}) => {
  /* ---------- VALIDATION ---------- */

  if (!title?.trim()) {
    throw new AppError("Title is required", 400);
  }
  if (!message?.trim()) {
    throw new AppError("Message is required", 400);
  }
  if (!AUDIENCES.includes(audience)) {
    throw new AppError("Audience must be one of ALL, ROLES or USERS", 400);
  }
  if (!SEVERITIES.includes(severity)) {
    throw new AppError("Severity must be one of info, warning or critical", 400);
  }

  if (audience === "ROLES") {
    if (!Array.isArray(roles) || roles.length === 0) {
      throw new AppError("Select at least one role", 400);
    }
    const invalid = roles.filter((r) => !TARGETABLE_ROLES.includes(r));
    if (invalid.length) {
      throw new AppError(`Unknown role(s): ${invalid.join(", ")}`, 400);
    }
  }

  if (audience === "USERS") {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError("Select at least one user", 400);
    }
    const invalid = userIds.filter((id) => !mongoose.isValidObjectId(id));
    if (invalid.length) {
      throw new AppError("One or more selected users are invalid", 400);
    }
  }

  /* ---------- RESOLVE AUDIENCE ---------- */

  const recipientIds = await resolveRecipients({ audience, roles, userIds });

  if (recipientIds.length === 0) {
    throw new AppError("No active users match the selected audience", 400);
  }

  /* ---------- RECORD THE BROADCAST ---------- */

  const broadcast = await NotificationBroadcast.create({
    title: title.trim(),
    message: message.trim(),
    severity,
    audience,
    roles: audience === "ROLES" ? roles : [],
    userIds: audience === "USERS" ? recipientIds : [],
    recipientCount: recipientIds.length,
    sentBy,
  });

  /* ---------- FAN OUT ---------- */

  const now = new Date();
  const docs = recipientIds.map((userId) => ({
    templateCode: "ADMIN_BROADCAST",
    title: broadcast.title,
    message: broadcast.message,
    severity,
    userId,
    source: "admin",
    broadcastId: broadcast._id,
    sentBy,
    payload: {},
    actions: [],
    isRead: false,
    createdAt: now,
    updatedAt: now,
  }));

  const created = [];
  for (const batch of chunk(docs, CHUNK_SIZE)) {
    // ordered:false so one bad document cannot abort the remaining recipients.
    const inserted = await Notification.insertMany(batch, { ordered: false });
    created.push(...inserted);
  }

  /* ---------- REALTIME (app open) ---------- */

  for (const doc of created) {
    emitToUser(doc.userId, "notification:new", {
      _id: doc._id,
      title: doc.title,
      message: doc.message,
      severity: doc.severity,
      source: doc.source,
      isRead: false,
      createdAt: doc.createdAt,
    });
  }

  /* ---------- DEVICE PUSH (app closed) ---------- */

  // Awaited so the admin gets a real delivered-device count back. It is safe to
  // block on: sendPushToUsers never throws, and the notification is already
  // durable in the database whatever FCM does.
  const pushResult = await sendPushToUsers(recipientIds, {
    title: broadcast.title,
    body: broadcast.message,
    severity,
    data: {
      type: "ADMIN_BROADCAST",
      broadcastId: String(broadcast._id),
      severity,
      route: "/notifications",
    },
  });

  return {
    broadcast,
    recipientCount: created.length,
    pushResult,
  };
};

/* ================= ADMIN: HISTORY ================= */

export const getBroadcastHistory = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    NotificationBroadcast.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sentBy", "name phone")
      .lean(),
    NotificationBroadcast.countDocuments({}),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
};

/* ================= USER: READ ================= */

export const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, unreadOnly = false } = {}
) => {
  const filter = { userId };
  if (unreadOnly === true || unreadOnly === "true") {
    filter.isRead = false;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { items, total, unreadCount, page: Number(page), limit: Number(limit) };
};

export const getUnreadCount = async (userId) =>
  Notification.countDocuments({ userId, isRead: false });

/* ================= USER: WRITE ================= */

export const markAsRead = async (userId, notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError("Invalid notification id", 400);
  }

  // Scoped by userId so one user can never flip another user's copy.
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { modified: result.modifiedCount ?? 0 };
};

export const deleteNotification = async (userId, notificationId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError("Invalid notification id", 400);
  }

  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });

  if (!deleted) {
    throw new AppError("Notification not found", 404);
  }

  return deleted;
};

/* ================= INTERNAL: SYSTEM EVENTS ================= */

/**
 * Helper for other backend services that need to raise a notification from a
 * domain event (order placed, appointment booked, …) rather than from the
 * admin panel.
 */
export const notifyUsers = async ({
  userIds,
  title,
  message,
  severity = "info",
  templateCode = "SYSTEM",
  payload = {},
  actions = [],
}) => {
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (ids.length === 0) return [];

  const docs = ids.map((userId) => ({
    templateCode,
    title,
    message,
    severity,
    userId,
    source: "system",
    payload,
    actions,
  }));

  const created = await Notification.insertMany(docs, { ordered: false });

  for (const doc of created) {
    emitToUser(doc.userId, "notification:new", {
      _id: doc._id,
      title: doc.title,
      message: doc.message,
      severity: doc.severity,
      source: doc.source,
      isRead: false,
      createdAt: doc.createdAt,
    });
  }

  // Device push, so the event reaches the user with the app closed too.
  await sendPushToUsers(ids, {
    title,
    body: message,
    severity,
    data: {
      type: templateCode,
      severity,
      route: "/notifications",
      ...payload,
    },
  });

  return created;
};
