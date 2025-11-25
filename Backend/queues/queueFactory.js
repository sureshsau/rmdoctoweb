import { BullMQQueueService } from "./bullmq.queue.js";
import { redisConnection } from "../config/redisConnection.js";

const queueService = new BullMQQueueService(redisConnection);

export default queueService;
