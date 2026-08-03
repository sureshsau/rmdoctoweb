import { getMessaging } from "../config/firebase.config.js";
import USER from "../models/user.model.js";

/* Android notification channel — must match the channel the app creates in
   services/push.js, otherwise Android silently drops the heads-up display. */
export const ANDROID_CHANNEL_ID = "rmdocto-default";

/* FCM caps sendEachForMulticast at 500 tokens per call. */
const MULTICAST_LIMIT = 500;

/* Error codes that mean "this token is dead, stop sending to it". */
const DEAD_TOKEN_ERRORS = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

/* Notification priority maps onto the app's severity levels. */
const androidPriorityFor = (severity) =>
  severity === "critical" ? "high" : "default";

/**
 * Remove tokens FCM has told us are permanently invalid, so the next send does
 * not waste a slot on them.
 */
const pruneDeadTokens = async (tokens) => {
  if (tokens.length === 0) return;

  try {
    await USER.updateMany(
      { "fcmTokens.token": { $in: tokens } },
      { $pull: { fcmTokens: { token: { $in: tokens } } } }
    );
    console.log(`🧹 PUSH: pruned ${tokens.length} dead device token(s)`);
  } catch (err) {
    console.error("PUSH: failed to prune dead tokens —", err.message);
  }
};

/**
 * Collect every device token registered to the given users.
 * Returns [{ token, userId }] so a failed send can be traced back.
 */
export const getTokensForUsers = async (userIds) => {
  const users = await USER.find({
    _id: { $in: userIds },
    "fcmTokens.0": { $exists: true },
  })
    .select("_id fcmTokens")
    .lean();

  const entries = [];
  for (const user of users) {
    for (const device of user.fcmTokens || []) {
      if (device?.token) {
        entries.push({ token: device.token, userId: user._id });
      }
    }
  }

  // The same physical device can end up listed twice after a re-login race;
  // sending twice would show the user two identical banners.
  const seen = new Set();
  return entries.filter((e) => {
    if (seen.has(e.token)) return false;
    seen.add(e.token);
    return true;
  });
};

/**
 * Send a push to a list of raw FCM tokens.
 *
 * Best-effort by contract: it never throws. Push is a delivery optimisation on
 * top of the database record, so a Firebase outage must not fail the API call
 * that triggered it.
 */
export const sendPushToTokens = async (
  tokens,
  { title, body, data = {}, severity = "info" } = {}
) => {
  const messaging = getMessaging();

  if (!messaging) {
    // Firebase not configured — silently skip, the in-app inbox still has it.
    return { sent: 0, failed: 0, skipped: tokens.length };
  }

  if (!tokens?.length) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // FCM data payload values must all be strings.
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v == null ? "" : String(v)])
  );

  let sent = 0;
  let failed = 0;
  const deadTokens = [];

  for (const batch of chunk(tokens, MULTICAST_LIMIT)) {
    const message = {
      tokens: batch,

      notification: { title, body },

      data: stringData,

      android: {
        priority: severity === "critical" ? "high" : "normal",
        notification: {
          channelId: ANDROID_CHANNEL_ID,
          priority: androidPriorityFor(severity),
          sound: "default",
          // Tapping the banner should open the app, not just dismiss it.
          clickAction: "OPEN_NOTIFICATION",
        },
      },

      apns: {
        headers: {
          "apns-priority": severity === "critical" ? "10" : "5",
        },
        payload: {
          aps: {
            sound: "default",
            // Wakes the app so the badge count can be refreshed in background.
            "content-available": 1,
          },
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((res, i) => {
        if (!res.success && DEAD_TOKEN_ERRORS.has(res.error?.code)) {
          deadTokens.push(batch[i]);
        }
      });
    } catch (err) {
      failed += batch.length;
      console.error("PUSH: multicast send failed —", err.message);
    }
  }

  if (deadTokens.length) {
    await pruneDeadTokens(deadTokens);
  }

  return { sent, failed, skipped: 0 };
};

/**
 * Send a push to every device belonging to the given users.
 * Never throws — see sendPushToTokens.
 */
export const sendPushToUsers = async (
  userIds,
  { title, body, data = {}, severity = "info" } = {}
) => {
  try {
    const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
    if (ids.length === 0) return { sent: 0, failed: 0, skipped: 0 };

    const entries = await getTokensForUsers(ids);
    const tokens = entries.map((e) => e.token);

    return await sendPushToTokens(tokens, { title, body, data, severity });
  } catch (err) {
    console.error("PUSH: sendPushToUsers failed —", err.message);
    return { sent: 0, failed: 0, skipped: 0 };
  }
};

/* ================= DEVICE TOKEN REGISTRY ================= */

/**
 * Attach a device token to a user.
 *
 * A token identifies a device install, not a person — so it is first detached
 * from every other account. Without that, the previous user of a shared phone
 * would keep receiving the new user's notifications.
 */
export const registerDeviceToken = async (
  userId,
  { token, platform = "android", deviceId = null }
) => {
  if (!token?.trim()) {
    throw new Error("Device token is required");
  }

  const clean = token.trim();

  // Detach from any other account (and from this one, so the re-add refreshes
  // platform / updatedAt rather than creating a duplicate).
  await USER.updateMany(
    { "fcmTokens.token": clean },
    { $pull: { fcmTokens: { token: clean } } }
  );

  await USER.updateOne(
    { _id: userId },
    {
      $push: {
        fcmTokens: {
          token: clean,
          platform,
          deviceId,
          updatedAt: new Date(),
        },
      },
    }
  );

  return { token: clean, platform };
};

/**
 * Detach a device token — called on logout so the phone stops receiving
 * notifications for an account that is no longer signed in.
 */
export const removeDeviceToken = async (userId, token) => {
  if (!token?.trim()) return { removed: false };

  await USER.updateOne(
    { _id: userId },
    { $pull: { fcmTokens: { token: token.trim() } } }
  );

  return { removed: true };
};
