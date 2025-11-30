import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import queueService from '../factory/queueFactory.js';
import { EmailOtp } from "../../services/email.service.js";

const emailWorker = queueService.subscribe("emailQueue", async (job) => {
  switch (job.name) {
    case "send-otp":
      await EmailOtp(job.data.email, job.data.otp);
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