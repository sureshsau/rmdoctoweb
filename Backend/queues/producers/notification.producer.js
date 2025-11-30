import queueService from "../factory/queueFactory.js";
import NOTIFICATION_TYPES from "../../constant/notificationType.js";

export const newUserNotification = (payload) => {
  return queueService.publish(
    "notificationQueue",
    {
      templateCode: NOTIFICATION_TYPES.NEW_USER_REQUEST,
      payload,
    },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 30000 },
      removeOnComplete: true,
    },
    NOTIFICATION_TYPES.NEW_USER_REQUEST
  );
};
