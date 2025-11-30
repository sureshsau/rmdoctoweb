import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env correctly
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// // Debug logs
// console.log("REDIS_HOST =", process.env.REDIS_HOST);
// console.log("REDIS_PORT =", process.env.REDIS_PORT);

export const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  maxRetriesPerRequest: null
};