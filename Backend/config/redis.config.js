import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();


const redisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,

  // Enables TLS if using "rediss://" or cloud Redis with TLS
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,

  // Industry-standard reconnect strategy
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000); // Max 5 seconds
    console.log(`🔄 Redis reconnect attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },

  // Drop socket & retry on network issues
  reconnectOnError(err) {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
    if (targetErrors.some(e => err.message.includes(e))) {
      console.error("⚠️ Redis reconnectOnError triggered:", err.message);
      return true;
    }
    return false;
  },

  maxRetriesPerRequest: null, // Required for BullMQ compatibility
};

let redis;

try {
  redis = new Redis(redisOptions);

  // Connection events (important for debugging in production)
  redis.on("connect", () => {
    console.log("🚀 Redis connected successfully");
  });

  redis.on("ready", () => {
    console.log("⚡ Redis is ready to use");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis Error:", err);
  });

  redis.on("close", () => {
    console.log("🔌 Redis connection closed");
  });

  redis.on("reconnecting", () => {
    console.log("🌀 Redis reconnecting...");
  });

} catch (err) {
  console.error("❌ Failed to initialize Redis:", err);
}

export default redis;
