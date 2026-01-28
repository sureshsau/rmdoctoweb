import { addMedicineService, getMedicineByIdService, getMedicinesService } from "../services/medicine.service.js";


export const addMedicineController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const medicine = await addMedicineService({
      medicineData: req.body,
      files: req.files,
      userId
    });

    return res.status(201).json({
      success: true,
      message: "Medicine added successfully",
      data: medicine
    });
  } catch (error) {
    console.error("❌ addMedicineController error", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add medicine"
    });
  }
};

/* 🔹 LIST MEDICINES (CARD VIEW) */
export const getMedicinesController = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const result = await getMedicinesService({
      page,
      limit,
      search
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch medicines"
    });
  }
};

/* 🔹 MEDICINE DETAILS PAGE */
export const getMedicineByIdController = async (req, res) => {
  try {
    const { medicineId } = req.params;

    const medicine = await getMedicineByIdService(medicineId);

    return res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};
