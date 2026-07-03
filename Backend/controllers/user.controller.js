import USER from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import { createUserService, addSavedAddressService, deleteSavedAddressService } from '../services/user.service.js';
import { uploadProfileImageToS3, deleteProfileImageFromS3, uploadKycDocumentToS3 } from "../services/aws.service.js";



export const getAllUserController = async (req, res) => {
  try {
    const users = await USER.find()
      .select("_id faceImage.url name email phone address district state pincode isActive isBlocked roles dashboard createdAt  rmCoinsBalance kycStatus kycDocuments")
      .lean();
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error in getAllUserController:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const createUserController = async (req, res) => {
  try {
    const user = await createUserService(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        dashboard: user.dashboard,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllDoctorsController = async (req, res) => {
  try {
    const doctors = await USER.find({
      roles: { $in: ["doctor"] },
      isActive: true,
      isBlocked: false
    })
      .select("_id faceImage.url name email phone dashboard createdAt profiles")
      .populate({ path: "profiles.doctorId" })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      count: doctors.length,
      data: doctors,
    });

  } catch (error) {
    console.error("Error in getAllDoctorsController:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllRMRidersController = async (req, res) => {
  try {
    const riders = await USER.find({
      roles: { $in: ["rmrider"] },
      isActive: true,
      isBlocked: false
    })
      .select("_id faceImage.url name email phone dashboard createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      message: "RM Riders fetched successfully",
      count: riders.length,
      data: riders,
    });

  } catch (error) {
    console.error("Error in getAllRMRidersController:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadProfilePictureController = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User ID provided in URL" });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const requesterId = req.user.id;
    const isAdmin = req.user.roles?.includes("admin");

    if (requesterId.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Not allowed to update this profile" });
    }

    const user = await USER.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Attempt to delete existing picture if present
    if (user.faceImage && user.faceImage.key && user.faceImage.bucket) {
      try {
        await deleteProfileImageFromS3(user.faceImage.bucket, user.faceImage.key);
      } catch (err) {
        console.error("Failed to delete older profile picture", err);
      }
    }

    const s3Result = await uploadProfileImageToS3({
      userId,
      imageBuffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname
    });

    user.faceImage = {
      url: s3Result.url,
      bucket: s3Result.bucket,
      key: s3Result.key,
      updatedAt: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      profileImage: user.faceImage
    });

  } catch (error) {
    next(error);
  }
};

export const getMyAddressesController = async (req, res, next) => {
  try {
    const user = await USER.findById(req.user.id).select("savedAddresses");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: user.savedAddresses || []
    });
  } catch (error) {
    next(error);
  }
};

export const addMyAddressController = async (req, res, next) => {
  try {
    const addresses = await addSavedAddressService(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: addresses
    });
  } catch (error) {
    if (error.message.includes("Maximum of 5 saved addresses")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteMyAddressController = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const addresses = await deleteSavedAddressService(req.user.id, addressId);
    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: addresses
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatusController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await USER.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User is now ${user.isActive ? 'Active' : 'Inactive'}`,
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

export const getMeController = async (req, res, next) => {
  try {
    const user = await USER.findById(req.user.id).select(
      "_id faceImage.url name email phone address district state pincode isActive isBlocked roles dashboard createdAt rmCoinsBalance kycStatus kycDocuments"
    ).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadKycDocumentController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { documentType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No document file provided" });
    }

    const user = await USER.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const s3Result = await uploadKycDocumentToS3({
      userId,
      documentType: documentType || "document",
      imageBuffer: file.buffer,
      mimeType: file.mimetype
    });

    user.kycDocuments.push({
      url: s3Result.url,
      documentType: documentType || "document"
    });
    user.kycStatus = "pending";
    await user.save();

    res.status(200).json({
      success: true,
      message: "KYC Document uploaded successfully",
      kycStatus: user.kycStatus,
      kycDocuments: user.kycDocuments
    });
  } catch (error) {
    next(error);
  }
};

export const updateKycStatusController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid KYC status" });
    }

    const user = await USER.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.kycStatus = status;
    
    // Clear documents if rejected so they can re-upload fresh ones
    if (status === "rejected") {
       user.kycDocuments = [];
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}`,
      kycStatus: user.kycStatus
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserDetailsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, address, district, state, pincode } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (district !== undefined) updates.district = district;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;

    const user = await USER.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User details updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
