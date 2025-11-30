import queueService from '../factory/queueFactory.js';
import connectdb from "../../config/mongoDB.config.js";
connectdb();
import { NotificationTemplate } from "../../models/notificationTemplate.model.js";
import { Notification } from "../../models/notification.model.js";
import USER from "../../models/user.model.js";   
import { io } from "../../sockets/socket.js";

queueService.subscribe("notificationQueue", async (job) => {
  try {
    console.log("📨 Notification job received:", job.name);
    
    const { templateCode, payload, userId } = job.data;
    console.log(templateCode);
    // 1️⃣ Load template
    const template = await NotificationTemplate.findOne({ code: templateCode });
    console.log("template: ", template);
    if (!template) {
      console.error("❌ Template not found:", templateCode);
      return;
    }

    // 2️⃣ Render placeholders
    let message = template.message;
    for (const key of template.placeholders || []) {
      message = message.replace(`{{${key}}}`, payload?.[key] ?? "");
    }

    // 3️⃣ Find receivers
    let receivers = [];

    if (userId) {
      receivers = await USER.find({ _id: userId });
    } else {
      receivers = await USER.find({ role: { $in: template.sendToRoles } });
    }
    console.log("Receivers Role Query:", template.sendToRoles);
console.log("Receivers Found:", receivers.length);

    // 4️⃣ Create notifications + emit realtime
    for (const user of receivers) {
      const notif = await Notification.create({
        templateCode: template.code,
        title: template.title,
        message,
        userId: user._id,
        payload,
        actions: template.actions,
        severity: template.severity,
      });

      console.log("✅ Created notification for:", user.email);

      io.to(`role:${user.role}`).emit("notification", {
        id: notif._id,
        title: notif.title,
        message: notif.message,
        severity: notif.severity,
        actions: notif.actions,
        payload: notif.payload,
        createdAt: notif.createdAt,
      });

      console.log("📡 Realtime sent to role:", user.role);
    }

  } catch (err) {
    console.error("🔥 Worker error:", err);
  }
});
