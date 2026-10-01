import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Role from "./models/role.model.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const roles = await Role.find({});
  console.log(roles.map(r => ({ key: r.key, name: r.name })));
  process.exit(0);
}
run();
