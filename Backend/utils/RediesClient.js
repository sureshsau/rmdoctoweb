import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

let redis;

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });

  console.log("🚀 Redis client initialized successfully");
} catch (err) {
  console.error("❌ Failed to initialize Redis:", err);
}

export default redis;
