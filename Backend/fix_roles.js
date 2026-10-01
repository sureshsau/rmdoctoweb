import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Role from "./models/role.model.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Update "admin" to "Administrator"
  await Role.updateOne({ key: "admin" }, { $set: { name: "Administrator" } });
  
  // Update "rmrider" to "Delivery Partner"
  await Role.updateOne({ key: "rmrider" }, { $set: { name: "Delivery Partner" } });
  
  // Rename "agent" to "rm_member" and name to "Community Partner"
  await Role.updateOne({ key: "agent" }, { $set: { key: "rm_member", name: "Community Partner" } });
  
  console.log("Roles updated in backend DB.");
  process.exit(0);
}
run();
