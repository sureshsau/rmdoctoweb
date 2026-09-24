/**
 * Creates (or promotes) a user as an admin.
 *
 *   node scripts/make-admin.mjs <10-digit-phone> "<Name>" [mongo-uri]
 *
 * Falls back to MONGO_URI from .env when no URI is passed. Idempotent — running
 * it twice on the same phone just re-applies the admin role.
 */
import "dotenv/config";
import mongoose from "mongoose";
import USER from "../models/user.model.js";
import ROLE from "../models/role.model.js";
import PERMISSIONS from "../permissions.json" with { type: "json" };

const [phone, name, uriArg] = process.argv.slice(2);
const uri = uriArg || process.env.MONGO_URI;

if (!phone || !/^\d{10}$/.test(phone) || !name) {
  console.error('Usage: node scripts/make-admin.mjs <10-digit-phone> "<Name>" [mongo-uri]');
  process.exit(1);
}
if (!uri) {
  console.error("No mongo URI given and MONGO_URI is not set.");
  process.exit(1);
}

// Flatten permissions.json into the same list the existing admin role carries.
const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((group) =>
  Object.keys(group.permissions)
);

await mongoose.connect(uri);
console.log("connected to:", mongoose.connection.db.databaseName);

// The roles collection backs the role-management screens; make sure "admin"
// exists there before handing the role out.
await ROLE.updateOne(
  { key: "admin" },
  { $set: { name: "Admin", permissions: ALL_PERMISSIONS } },
  { upsert: true }
);

let user = await USER.findOne({ phone });

if (user) {
  console.log("existing user found:", user._id.toString());
  user.name = name;
  user.dashboard = "admin";
  user.roles = Array.from(new Set([...(user.roles || []), "admin"]));
  user.isActive = true;
  user.isBlocked = false;
} else {
  user = new USER({
    name,
    phone,
    dashboard: "admin",
    roles: ["admin"],
    isActive: true,
    isBlocked: false,
  });
  console.log("creating new user");
}

// Not in the schema, but the login response echoes it to drive the dashboard UI.
user.set("permissions", ALL_PERMISSIONS, { strict: false });

await user.save();

console.log("done:", JSON.stringify({
  _id: user._id,
  name: user.name,
  phone: user.phone,
  dashboard: user.dashboard,
  roles: user.roles,
  permissionCount: ALL_PERMISSIONS.length,
}, null, 2));

await mongoose.disconnect();
process.exit(0);
