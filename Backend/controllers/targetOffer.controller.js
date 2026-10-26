import TargetOffer from "../models/targetOffer.model.js";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import CommunityPartnerProfile from "../models/communityPartnerProfile.model.js";
import mongoose from "mongoose";
import { uploadBannerImageToS3 } from "../services/aws.service.js";

// CREATE TARGET
export const createTarget = async (req, res) => {
  try {
    const targetData = { ...req.body };
    if (targetData.targetPeriodType === "MONTHLY") {
       targetData.startDate = new Date(`${targetData.targetMonth}-01T00:00:00.000Z`);
       targetData.endDate = new Date(targetData.startDate.getFullYear(), targetData.startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (targetData.targetPeriodType === "YEARLY") {
       targetData.startDate = new Date(`${targetData.targetMonth}-01-01T00:00:00.000Z`);
       targetData.endDate = new Date(`${targetData.targetMonth}-12-31T23:59:59.999Z`);
    } else if (targetData.targetPeriodType === "CUSTOM") {
       targetData.startDate = new Date(`${targetData.startDate}T00:00:00.000Z`);
       targetData.endDate = new Date(`${targetData.endDate}T23:59:59.999Z`);
       targetData.targetMonth = "CUSTOM"; // Group all custom under this
    }

    if (req.file) {
      const bannerResult = await uploadBannerImageToS3({
        imageBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        fileName: req.file.originalname
      });
      targetData.bannerImage = bannerResult;
    }
    const target = new TargetOffer(targetData);
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
    const updateData = { ...req.body };
    if (updateData.targetPeriodType === "MONTHLY") {
       updateData.startDate = new Date(`${updateData.targetMonth}-01T00:00:00.000Z`);
       updateData.endDate = new Date(updateData.startDate.getFullYear(), updateData.startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (updateData.targetPeriodType === "YEARLY") {
       updateData.startDate = new Date(`${updateData.targetMonth}-01-01T00:00:00.000Z`);
       updateData.endDate = new Date(`${updateData.targetMonth}-12-31T23:59:59.999Z`);
    } else if (updateData.targetPeriodType === "CUSTOM") {
       updateData.startDate = new Date(`${updateData.startDate}T00:00:00.000Z`);
       updateData.endDate = new Date(`${updateData.endDate}T23:59:59.999Z`);
       updateData.targetMonth = "CUSTOM";
    }

    if (req.file) {
      const bannerResult = await uploadBannerImageToS3({
        imageBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        fileName: req.file.originalname
      });
      updateData.bannerImage = bannerResult;
    }
    const target = await TargetOffer.findByIdAndUpdate(id, updateData, { new: true });
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
    const { month } = req.query; // YYYY-MM, YYYY, or CUSTOM
    if (!month) return res.status(400).json({ success: false, message: "targetMonth is required" });

    const allTargets = await TargetOffer.find({ targetMonth: month, isActive: true }).sort({ rank: 1 });
    if (allTargets.length === 0) {
      return res.status(200).json({ success: true, progressReport: [], activeTargets: [] });
    }

    // Use the exact date range from the targets
    const startDate = allTargets[0].startDate;
    const endDate = allTargets[0].endDate;

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
          as: "cpDetails"
        }
      },
      { $unwind: "$cpDetails" },
      {
        $group: {
          _id: "$cpDetails.userId",
          cpProfileId: { $first: "$cpDetails._id" },
          parentCpId: { $first: "$cpDetails.parentCommunityPartnerId" },
          totalSales: { $sum: "$pricing.payableAmount" }
        }
      }
    ]);

    // Format the response
    const progressReport = await Promise.all(salesData.map(async (data) => {
      // Find the community_partner user
      const cpUser = await mongoose.model("User").findById(data._id).select("name phone");
      const isSubCp = !!data.parentCpId;
      
      let parentUserId = null;
      if (isSubCp) {
        const parentProfile = await CommunityPartnerProfile.findById(data.parentCpId);
        if (parentProfile) parentUserId = parentProfile.userId.toString();
      }

      // Filter targets applicable to this CP
      const targets = allTargets.filter(t => {
        if (t.audienceType === "ALL_MAIN_CPS" && !isSubCp) return true;
        if (t.audienceType === "ALL_SUB_CPS" && isSubCp) return true;
        if (t.audienceType === "SPECIFIC_CP" && t.audienceRefId?.toString() === data._id.toString()) return true;
        if (t.audienceType === "SUB_CPS_OF" && isSubCp && t.audienceRefId?.toString() === parentUserId) return true;
        return false;
      });

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
        communityPartnerName: cpUser ? cpUser.name : "Unknown",
        community_partnerPhone: cpUser ? cpUser.phone : "Unknown",
        totalSales: data.totalSales,
        achievedTarget: currentTarget ? currentTarget.rewardDescription : "None",
        nextTargetAmount: nextTarget ? nextTarget.targetSalesAmount : null,
        nextTargetReward: nextTarget ? nextTarget.rewardDescription : null,
        applicableTargetsCount: targets.length
      };
    }));

    res.status(200).json({ success: true, month, progressReport, activeTargets: allTargets });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to calculate target progress", error: error.message });
  }
};

// GET PROGRESS FOR CURRENT LOGGED IN AGENT
export const getMyTargetProgress = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { month } = req.query; 
    
    // Default to current month if not provided
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const allTargets = await TargetOffer.find({ targetMonth, isActive: true }).sort({ rank: 1 });
    if (allTargets.length === 0) {
      return res.status(200).json({ success: true, targetMonth, totalSales: 0, activeTargets: [] });
    }

    const startDate = allTargets[0].startDate;
    const endDate = allTargets[0].endDate;

    const communityPartnerProfile = await CommunityPartnerProfile.findOne({ userId });
    if (!communityPartnerProfile) {
      return res.status(404).json({ success: false, message: "Community Partner profile not found" });
    }

    const isSubCp = !!communityPartnerProfile.parentCommunityPartnerId;
    let parentUserId = null;
    if (isSubCp) {
      const parentProfile = await CommunityPartnerProfile.findById(communityPartnerProfile.parentCommunityPartnerId);
      if (parentProfile) parentUserId = parentProfile.userId.toString();
    }

    // Filter targets applicable to this CP
    const targets = allTargets.filter(t => {
      if (t.audienceType === "ALL_MAIN_CPS" && !isSubCp) return true;
      if (t.audienceType === "ALL_SUB_CPS" && isSubCp) return true;
      if (t.audienceType === "SPECIFIC_CP" && t.audienceRefId?.toString() === userId.toString()) return true;
      if (t.audienceType === "SUB_CPS_OF" && isSubCp && t.audienceRefId?.toString() === parentUserId) return true;
      return false;
    });

    // Aggregate downline CPs using graphLookup
    const allDescendants = await CommunityPartnerProfile.aggregate([
      { $match: { _id: communityPartnerProfile._id } },
      {
        $graphLookup: {
          from: "communitypartnerprofiles",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentCommunityPartnerId",
          as: "downline"
        }
      }
    ]);

    const downlineIds = allDescendants[0]?.downline.map(d => d._id) || [];
    const allRelevantCpIds = [communityPartnerProfile._id, ...downlineIds];

    // Find all users belonging to this Main CP or any of their Sub-CPs
    const community_partnerUsers = await mongoose.model("User").find({ "profiles.communityPartnerId": { $in: allRelevantCpIds } });
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
