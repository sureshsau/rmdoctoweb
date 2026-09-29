import mongoose from "mongoose";
import dotenv from "dotenv";
import CommunityPartnerProfile from "./models/communityPartnerProfile.model.js";

dotenv.config();

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'RMCP';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const cps = await CommunityPartnerProfile.find({ $or: [{ referralCode: { $exists: false } }, { referralCode: null }] });
    console.log(`Found ${cps.length} CPs without referral code.`);

    for (let cp of cps) {
      let code;
      let isUnique = false;
      while (!isUnique) {
        code = generateReferralCode();
        const existing = await CommunityPartnerProfile.findOne({ referralCode: code });
        if (!existing) isUnique = true;
      }
      
      cp.referralCode = code;
      await cp.save();
      console.log(`Generated referral code ${code} for CP ${cp._id}`);
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
