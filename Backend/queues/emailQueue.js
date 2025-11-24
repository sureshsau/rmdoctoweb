import { Queue } from "bullmq";
import { redisConnection } from "../config/redisConnection.js";
export const emailQueue = new Queue("emailQueue", {
  connection: redisConnection,
});
