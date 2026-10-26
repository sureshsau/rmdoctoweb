import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import LabTest from "../models/lab/labTest.model.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  // Delete older legacy package records that had no shortCode or isPackage: false/undefined
  const deleted = await LabTest.deleteMany({
    category: "Health Package",
    isPackage: { $ne: true }
  });
  console.log("Cleaned legacy packages without isPackage: true:", deleted.deletedCount);

  // Set isPackage: false on all remaining non-package tests
  const updated = await LabTest.updateMany(
    { isPackage: { $ne: true } },
    { $set: { isPackage: false } }
  );
  console.log("Updated tests to isPackage: false:", updated.modifiedCount);

  const finalPkgs = await LabTest.find({ isPackage: true }).select("name shortCode pricing.userPrice");
  console.log("Final active packages in DB:", finalPkgs.map(p => `${p.name} (₹${p.pricing?.userPrice})`));

  await mongoose.disconnect();
}

run().catch(console.error);
