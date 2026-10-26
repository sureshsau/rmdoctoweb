// controllers/lab.controller.js
import {
  createLabService,
  getLabsService,
  getLabByIdService,
  updateLabService,
  deleteLabService,
  createLabTestService,
  createLabPackageService,
  getLabTestsService,
  getLabTestByIdService,
  updateLabTestService,
  deleteLabTestService
} from "../services/lab.service.js";
import { cleanupUploadedFile } from "../utils/cleanupUploadedFile.js";

/* ═══════════════════════ LAB CRUD ═══════════════════════ */

export const createLabController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const lab = await createLabService({
      labData: req.body,
      files:   req.files,
      userId
    });

    return res.status(201).json({ success: true, message: "Lab created successfully", data: lab });
  } catch (error) {
    console.error("❌ createLabController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  } finally {
    await cleanupUploadedFile(req);
  }
};

export const getLabsController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", city = "", includeInactive = false } = req.query;
    const result = await getLabsService({
      page,
      limit,
      search,
      city,
      includeInactive: includeInactive === "true" || includeInactive === true
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLabByIdController = async (req, res) => {
  try {
    const lab = await getLabByIdService(req.params.labId);
    return res.status(200).json({ success: true, data: lab });
  } catch (error) {
    return res.status(error.statusCode || 404).json({ success: false, message: error.message });
  }
};

export const updateLabController = async (req, res) => {
  try {
    const updated = await updateLabService(req.params.labId, req.body);
    return res.status(200).json({ success: true, message: "Lab updated successfully", data: updated });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteLabController = async (req, res) => {
  try {
    await deleteLabService(req.params.labId);
    return res.status(200).json({ success: true, message: "Lab deactivated successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════ LAB TEST CRUD ═══════════════════════ */

export const createLabTestController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const test = await createLabTestService({ testData: req.body, userId });
    return res.status(201).json({ success: true, message: "Lab test created successfully", data: test });
  } catch (error) {
    console.error("❌ createLabTestController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const createLabPackageController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const pkg = await createLabPackageService({ packageData: req.body, userId });
    return res.status(201).json({ success: true, message: "Health package created successfully", data: pkg });
  } catch (error) {
    console.error("❌ createLabPackageController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getLabTestsController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", labId = "", category = "", sampleType = "", isPackage } = req.query;
    const result = await getLabTestsService({ page, limit, search, labId, category, sampleType, isPackage });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLabPackagesController = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", labId = "" } = req.query;
    const result = await getLabTestsService({
      page,
      limit,
      search,
      labId,
      isPackage: true
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLabTestByIdController = async (req, res) => {
  try {
    const test = await getLabTestByIdService(req.params.testId);
    return res.status(200).json({ success: true, data: test });
  } catch (error) {
    return res.status(error.statusCode || 404).json({ success: false, message: error.message });
  }
};

export const updateLabTestController = async (req, res) => {
  try {
    const updated = await updateLabTestService(req.params.testId, req.body);
    return res.status(200).json({ success: true, message: "Lab test updated successfully", data: updated });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteLabTestController = async (req, res) => {
  try {
    await deleteLabTestService(req.params.testId);
    return res.status(200).json({ success: true, message: "Lab test deactivated successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
