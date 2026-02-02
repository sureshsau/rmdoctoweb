import express from 'express'
import {authenticate, authorize} from '../middlewares/auth.middlewire.js'
import { parseAddMedicinePayload, validateAddMedicine } from '../validator/medicine/addMedicine.validator.js';
import { addMedicineController, deleteMedicineController, editMedicineController, getMedicineByIdController, getMedicinesController } from '../controllers/medicine.controller.js';
import { upload } from '../utils/multer.js';

const router=express.Router()

router.post(
  "/",
  authenticate,
  authorize(["medicine.create"]),
  upload.array("images", 5),
  parseAddMedicinePayload,
  validateAddMedicine,
  addMedicineController
)
.get("/", getMedicinesController)
.get("/:medicineId", getMedicineByIdController)

.put(
  "/:medicineId",
  authenticate,
  authorize("medicine.update"),
  editMedicineController
)
.delete('/:medicineId',
  authorize("medicine.delete"),
  deleteMedicineController
)
export default router;