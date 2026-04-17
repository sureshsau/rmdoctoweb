import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middlewire.js';
import { parseAddMedicinePayload, validateAddMedicine } from '../validator/medicine/addMedicine.validator.js';
import { addMedicineController, deleteMedicineController, editMedicineController, getMedicineByIdController, getMedicinesController } from '../controllers/medicine.controller.js';
import { upload } from '../utils/multer.js';

const router = express.Router();

// Add medicine
router.post(
  '/',
  authenticate,
  authorize('medicine.create'),
  upload.array('images', 5),
  parseAddMedicinePayload,
  validateAddMedicine,
  addMedicineController
);

// View all medicines (public)
router.get('/', getMedicinesController);

// View single medicine (public)
router.get('/:medicineId', getMedicineByIdController);

// Update medicine
router.put(
  '/:medicineId',
  authenticate,
  authorize('medicine.update'),
  editMedicineController
);

// Delete medicine
router.delete(
  '/:medicineId',
  authenticate,
  authorize('medicine.delete'),
  deleteMedicineController
);

export default router;