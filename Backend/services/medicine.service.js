// services/medicine.service.js
import mongoose from "mongoose";
import Medicine from "../models/medicine.model.js";
import { deleteMedicineImageFromS3, uploadMedicineImageToS3 } from "./aws.service.js";
import AppError from "../utils/AppError.js";

export const addMedicineService = async ({
  medicineData,
  files,
  userId,
}) => {
  try {

    let images = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const uploadResult = await uploadMedicineImageToS3({
          medicineId: "temp",
          imageType: "gallery",
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
          fileName: file.originalname,
        });

        images.push({
          url: uploadResult.url,
          key: uploadResult.key,
        });
      }
    }

    const medicine = await Medicine.create({
      ...medicineData,
      images,
      addedBy: userId,
    });

    return medicine;
  } catch (error) {
    console.error("❌ addMedicineService error", error);
    throw error;
  }
};


export const getMedicinesService = async ({
  page = 1,
  limit = 10,
  search = "",
  dosageForm = ""
}) => {
  page = Number(page);
  limit = Number(limit);

  const skip = (page - 1) * limit;

  const query = {
    isActive: true
  };

  /* 🔍 SEARCH (name, brandName, tags, therapeuticUse, composition) */
  if (search && search.trim() !== "") {
    const regex = new RegExp(search.trim(), "i");

    query.$or = [
      { name: regex },
      { brandName: regex },
      { therapeuticUse: regex },
      { tags: regex },
      { "composition.ingredient": regex }
    ];
  }

  /* 💊 DOSAGE FORM FILTER */
  if (dosageForm && dosageForm.trim() !== "") {
    query.dosageForm = dosageForm;
  }

  /* 📦 FETCH DATA */
  const medicines = await Medicine.find(query)
    .select(
      "name brandName dosageForm pricing.price pricing.mrp pricing.specialPrice images isActive"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Medicine.countDocuments(query);

  /* 🔄 FORMAT RESPONSE */
  return {
    data: medicines.map(med => ({
      _id: med._id,
      name: med.name,
      brandName: med.brandName,
      dosageForm: med.dosageForm,

      price: med.pricing?.price,
      mrp: med.pricing?.mrp,
      specialPrice: med.pricing?.specialPrice,

      image:
        med.images?.[0]?.url || null
    })),

    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};



/* 🔹 GET SINGLE MEDICINE DETAILS */

export const getMedicineByIdService = async (medicineId) => {
  // 🔒 Prevent CastError
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError("Invalid medicine ID", 400);
  }

  const medicine = await Medicine.findById(medicineId)
    .select("-images.key") // hide S3 key
    .populate({
      path: "addedBy",
      select: "name phone profileImage email",
    })
    .lean();

  if (!medicine) {
    throw new AppError("Medicine not found", 404);
  }

  return medicine;
};


export const editMedicineService = async (medicineId, updateData) => {
  // 🔒 Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError("Invalid medicine ID", 400);
  }

  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new AppError("Medicine not found", 404);
  }

  // 🔥 Update only allowed fields (safe merge)
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      medicine[key] = updateData[key];
    }
  });

  await medicine.save();

  return medicine;
};




export const deleteMedicineService = async (medicineId) => {
  const medicine = await Medicine.findById(medicineId);

  if (!medicine) {
    throw new AppError("Medicine not found", 404);
  }

  // 🔥 Delete images from S3
  if (medicine.images && medicine.images.length > 0) {
    await Promise.all(
      medicine.images.map((img) => {
        if (img.key) {
          return deleteMedicineImageFromS3(img.key);
        }
      })
    );
  }

  // 🔥 Delete medicine from DB
  await medicine.deleteOne();

  return true;
};
