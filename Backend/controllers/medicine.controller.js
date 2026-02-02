import { addMedicineService, deleteMedicineService, getMedicineByIdService, getMedicinesService } from "../services/medicine.service.js";


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
    const dosageForm = req.query.dosageForm || "";


    const result = await getMedicinesService({
      page,
      limit,
      search,
      dosageForm,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET MEDICINES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch medicines",
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


import { editMedicineService } from "../services/medicine.service.js";

export const editMedicineController = async (req, res) => {
  try {
    const { medicineId } = req.params;

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: "Medicine ID is required",
      });
    }

    const updatedMedicine = await editMedicineService(
      medicineId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: updatedMedicine,
    });
  } catch (error) {
    console.error("❌ editMedicineController error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


export const deleteMedicineController = async (req, res) => {
  try {
    const { medicineId } = req.params;

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: "Medicine ID is required",
      });
    }

    await deleteMedicineService(medicineId);

    return res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("❌ deleteMedicineController error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
