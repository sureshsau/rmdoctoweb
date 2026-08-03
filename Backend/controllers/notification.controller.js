import * as notificationService from "../services/notification.service.js";
import { TARGETABLE_ROLES } from "../services/notification.service.js";
import {
  registerDeviceToken,
  removeDeviceToken,
} from "../services/push.service.js";
import { isPushConfigured } from "../config/firebase.config.js";

/* ================= USER ================= */

// GET /notifications
export const GetAllNotification = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(req.user.id, {
      page: page || 1,
      limit: limit || 20,
      unreadOnly,
    });

    return res.status(200).json({
      success: true,
      count: result.items.length,
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      limit: result.limit,
      data: result.items,
    });
  } catch (err) {
    next(err);
  }
};

// GET /notifications/unread-count
export const getUnreadCountController = async (req, res, next) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    return res.status(200).json({ success: true, unreadCount });
  } catch (err) {
    next(err);
  }
};

// PATCH /notifications/:id/read
export const markAsReadController = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /notifications/read-all
export const markAllAsReadController = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modified: result.modified,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /notifications/:id
export const deleteNotificationController = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.user.id, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (err) {
    next(err);
  }
};

/* ================= DEVICE TOKENS ================= */

// POST /notifications/device-token
export const registerDeviceTokenController = async (req, res, next) => {
  try {
    const { token, platform, deviceId } = req.body;

    if (!token?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Device token is required" });
    }

    await registerDeviceToken(req.user.id, { token, platform, deviceId });

    return res.status(200).json({
      success: true,
      message: "Device registered for push notifications",
      pushEnabled: isPushConfigured(),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /notifications/device-token
export const removeDeviceTokenController = async (req, res, next) => {
  try {
    // Sent on logout — accept the token from the body or the query string so
    // the client can use whichever is convenient.
    const token = req.body?.token || req.query?.token;

    await removeDeviceToken(req.user.id, token);

    return res.status(200).json({
      success: true,
      message: "Device unregistered",
    });
  } catch (err) {
    next(err);
  }
};

/* ================= ADMIN ================= */

// POST /notifications/send  (admin only)
export const sendNotificationController = async (req, res, next) => {
  try {
    const { title, message, severity, audience, roles, userIds } = req.body;

    const { broadcast, recipientCount, pushResult } =
      await notificationService.sendBroadcast({
        title,
        message,
        severity,
        audience,
        roles,
        userIds,
        sentBy: req.user.id,
      });

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${recipientCount} user${recipientCount === 1 ? "" : "s"}`,
      recipientCount,
      // How many physical devices actually got a push banner. Lower than
      // recipientCount whenever users have not opened the app since the
      // update, or have notifications turned off.
      devicesPushed: pushResult?.sent || 0,
      pushEnabled: isPushConfigured(),
      data: broadcast,
    });
  } catch (err) {
    next(err);
  }
};

// GET /notifications/sent  (admin only)
export const getSentNotificationsController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await notificationService.getBroadcastHistory({
      page: page || 1,
      limit: limit || 20,
    });

    return res.status(200).json({
      success: true,
      count: result.items.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: result.items,
    });
  } catch (err) {
    next(err);
  }
};

// GET /notifications/roles  (admin only) — audience options for the composer
export const getTargetableRolesController = async (req, res) => {
  return res.status(200).json({ success: true, data: TARGETABLE_ROLES });
};
