import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AppError from "../utils/AppError.js";

// Convert import.meta.url to actual file path (Windows Safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// permissions.json is inside Backend root
const permissionsFile = path.join(__dirname, "..", "permissions.json");

export function getAllPermissions() {
  try {
    const jsonData = fs.readFileSync(permissionsFile, "utf-8");
    return JSON.parse(jsonData);
  } catch (err) {
    console.error("Error loading permission file:", err);
    throw new AppError("Could not load permissions file", 500);
  }
}
