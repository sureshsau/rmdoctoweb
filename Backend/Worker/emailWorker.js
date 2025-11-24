import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { Worker } from "bullmq";

import { redisConnection } from "../config/redisConnection.js";
import { sendOtpEmail } from "../utils/Email.js";

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { email, otp } = job.data;
     console.log(`📩 Sending OTP to ${email}`);
    await sendOtpEmail(email, otp);
    console.log(`✅ OTP sent`);
  },
  { connection: redisConnection }
)

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job failed ${job.id}:`, err);
});