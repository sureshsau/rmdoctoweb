import { getCommunityPartnerVisibleNetwork, registerCommunityPartnerByAdminService } from "../services/communityPartner.service.js";
import { getBlockCoordinatorTree } from "../services/blockCoordinator.service.js";
import User from "../models/user.model.js";

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/community_partner/:userId
   Admin views any specific CommunityPartner's full network tree
────────────────────────────────────────────────────────────── */
export const adminGetCommunityPartnerNetworkController = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await getCommunityPartnerVisibleNetwork({ communityPartnerUserId: userId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("adminGetCommunityPartnerNetworkController error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/marketing-community_partner/:userId
   Admin views any specific Marketing CommunityPartner's full tree
────────────────────────────────────────────────────────────── */
export const adminGetBlockCoordinatorNetworkController = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await getBlockCoordinatorTree({ blockCoordinatorUserId: userId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("adminGetBlockCoordinatorNetworkController error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/community_partners
   Admin gets a list of all root community_partners (level 0, no parent)
   for quick selection in the pick list
────────────────────────────────────────────────────────────── */
export const adminGetAllCommunityPartnersController = async (req, res) => {
  try {
    const community_partners = await User.find({
      roles: { $in: ["community_partner"] },
    })
      .select("_id name phone faceImage isActive profiles")
      .populate({
        path: "profiles.communityPartnerId",
        populate: {
          path: "parentCommunityPartnerId",
          populate: {
            path: "userId",
            select: "name"
          }
        }
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: community_partners,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /admin/network/marketing-community_partners
   Admin gets a list of all marketing community_partners for the pick list
────────────────────────────────────────────────────────────── */
export const adminGetAllBlockCoordinatorsController = async (req, res) => {
  try {
    const community_partners = await User.find({
      roles: { $in: ["block_coordinator"] },
    })
      .select("_id name phone faceImage isActive")
      .lean();

    return res.status(200).json({
      success: true,
      data: community_partners,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const registerCommunityPartnerByAdminController = async (req, res) => {
  try {
      const payload=req.body;
      const data=await registerCommunityPartnerByAdminService({payload})

    return res.status(201).json({
      success: true,
      message: "Community Partner registered successfully",
      data: data,
    });

  } catch (error) {
    console.error("❌ CommunityPartner registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
