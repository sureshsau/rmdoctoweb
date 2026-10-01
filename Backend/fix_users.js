import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "./models/user.model.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const res = await User.updateMany(
    { dashboard: "agent" },
    { $set: { dashboard: "rm_member" } }
  );
  console.log(`Updated dashboard for ${res.modifiedCount} users`);
  
  const res2 = await User.updateMany(
    { roles: "agent" },
    { $set: { "roles.$": "rm_member" } }
  );
  console.log(`Updated roles array for ${res2.modifiedCount} users`);
  
  process.exit(0);
}
run();
