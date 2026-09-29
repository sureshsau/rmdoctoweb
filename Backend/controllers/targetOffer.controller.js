import TargetOffer from "../models/targetOffer.model.js";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import CommunityPartnerProfile from "../models/communityPartnerProfile.model.js";
import mongoose from "mongoose";

// CREATE TARGET
export const createTarget = async (req, res) => {
  try {
    const target = new TargetOffer(req.body);
    await target.save();
    res.status(201).json({ success: true, message: "Target created successfully", target });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create target", error: error.message });
  }
};

// GET ALL TARGETS
export const getAllTargets = async (req, res) => {
  try {
    const { month } = req.query; // Optional filter by month (YYYY-MM)
    const filter = month ? { targetMonth: month } : {};
    
    const targets = await TargetOffer.find(filter).sort({ rank: 1 });
    res.status(200).json({ success: true, targets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch targets", error: error.message });
  }
};

// UPDATE TARGET
export const updateTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await TargetOffer.findByIdAndUpdate(id, req.body, { new: true });
    if (!target) {
      return res.status(404).json({ success: false, message: "Target not found" });
    }
    res.status(200).json({ success: true, message: "Target updated successfully", target });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update target", error: error.message });
  }
};

// DELETE TARGET
export const deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await TargetOffer.findByIdAndDelete(id);
    if (!target) {
      return res.status(404).json({ success: false, message: "Target not found" });
    }
    res.status(200).json({ success: true, message: "Target deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete target", error: error.message });
  }
};

// GET PROGRESS FOR A SPECIFIC AGENT OR ALL AGENTS
export const getCommunityPartnerTargetProgress = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ success: false, message: "targetMonth is required (YYYY-MM)" });

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const targets = await TargetOffer.find({ targetMonth: month, isActive: true }).sort({ rank: 1 });

    // Aggregate Medicine Orders by CommunityPartner
    const salesData = await MedicineOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $lookup: {
          from: "community_partnerprofiles",
          localField: "userDetails.profiles.communityPartnerId",
          foreignField: "_id",
          as: "community_partnerDetails"
        }
      },
      { $unwind: "$community_partnerDetails" },
      {
        $group: {
          _id: "$community_partnerDetails.userId",
          totalSales: { $sum: "$pricing.payableAmount" }
        }
      }
    ]);

    // Format the response
    const progressReport = await Promise.all(salesData.map(async (data) => {
      // Find the community_partner user
      const community_partnerUser = await mongoose.model("User").findById(data._id).select("name phone");
      
      let currentTarget = null;
      let nextTarget = null;

      for (let i = 0; i < targets.length; i++) {
        if (data.totalSales >= targets[i].targetSalesAmount) {
          currentTarget = targets[i];
        } else {
          nextTarget = targets[i];
          break;
        }
      }

      return {
        communityPartnerId: data._id,
        communityPartnerName: community_partnerUser ? community_partnerUser.name : "Unknown",
        community_partnerPhone: community_partnerUser ? community_partnerUser.phone : "Unknown",
        totalSales: data.totalSales,
        achievedTarget: currentTarget ? currentTarget.rewardDescription : "None",
        nextTargetAmount: nextTarget ? nextTarget.targetSalesAmount : null,
        nextTargetReward: nextTarget ? nextTarget.rewardDescription : null,
      };
    }));

    res.status(200).json({ success: true, month, progressReport, activeTargets: targets });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to calculate target progress", error: error.message });
  }
};

// GET PROGRESS FOR CURRENT LOGGED IN AGENT
export const getMyTargetProgress = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { month } = req.query; // YYYY-MM
    
    // Default to current month if not provided
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const startDate = new Date(`${targetMonth}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const targets = await TargetOffer.find({ targetMonth, isActive: true }).sort({ rank: 1 });

    // Aggregate sales specifically for this community_partner's downline or direct users
    // Since medicineOrder has userId, we need to find all orders by users who belong to this community_partner
    const communityPartnerProfile = await CommunityPartnerProfile.findOne({ userId });
    
    if (!communityPartnerProfile) {
      return res.status(404).json({ success: false, message: "RM Member profile not found" });
    }

    // Find all users belonging to this community_partner
    const community_partnerUsers = await mongoose.model("User").find({ "profiles.communityPartnerId": communityPartnerProfile._id });
    const userIds = community_partnerUsers.map(u => u._id);

    const salesData = await MedicineOrder.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$pricing.payableAmount" }
        }
      }
    ]);

    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

    res.status(200).json({ success: true, targetMonth, totalSales, activeTargets: targets });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch progress", error: error.message });
  }
};
