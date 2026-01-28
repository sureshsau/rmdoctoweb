// services/medicine.service.js
import Medicine from "../models/medicine.model.js";
import { uploadMedicineImageToS3 } from "./aws.service.js";

export const addMedicineService = async ({
  medicineData,
  files,
  userId
}) => {
  try {
    if (!userId) throw new Error("Unauthorized");

    let images = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const uploadResult = await uploadMedicineImageToS3({
          medicineId: "temp",
          imageType: i === 0 ? "primary" : "gallery",
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
          fileName: file.originalname
        });

        images.push({
          url: uploadResult.url,
          isPrimary: i === 0
        });
      }
    }

    const medicine = await Medicine.create({
      ...medicineData,
      images,
      addedBy: userId
    });

    return medicine;
  } catch (error) {
    console.error("❌ addMedicineService error", error);
    throw error;
  }
};


/* 🔹 GET MEDICINES FOR LIST / CARD VIEW (PAGINATED) */
export const getMedicinesService = async ({
  page = 1,
  limit = 10,
  search = ""
}) => {
  const skip = (page - 1) * limit;

  const query = {
    isActive: true
  };

  if (search) {
    query.$text = { $search: search };
  }

  const medicines = await Medicine.find(query)
    .select(
      "name brandName dosageForm pricing.normalUserPrice pricing.mrp pricing.marketingAgentPrice images isActive"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Medicine.countDocuments(query);

  return {
    data: medicines.map(med => ({
      _id: med._id,
      name: med.name,
      brandName: med.brandName,
      dosageForm: med.dosageForm,
      price: med.pricing?.normalUserPrice,
      mrp:med.pricing.mrp,
      agentPrice: med.pricing?.marketingAgentPrice,
      image:
        med.images?.find(img => img.isPrimary)?.url ||
        med.images?.[0]?.url ||
        null
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
  const medicine = await Medicine.findOne({
    _id: medicineId,
    isActive: true
  }).lean();

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  return medicine;
};
