import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import queueService from '../queues/queueFactory.js';
import { redisConnection } from "../config/redisConnection.js";
import { sendOtpEmail } from "../utils/Email.js";

const emailWorker = queueService.subscribe("emailQueue", async (job) => {
  switch (job.name) {
    case "send-otp":
      await sendOtpEmail(job.data.email, job.data.otp);
      break;

    case "welcome-email":
      await sendWelcomeEmail(job.data.email);
      break;

    case "invoice-email":
      await sendInvoice(job.data.invoiceId);
      break;

    default:
      console.log("⚠️ Unknown job:", job.name);
  }
});


emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job failed ${job.id}:`, err);
});