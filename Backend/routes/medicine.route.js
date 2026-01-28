import express from 'express'
import {authenticate} from '../middlewares/auth.middlewire.js'
import { parseAddMedicinePayload, validateAddMedicine } from '../validator/medicine/addMedicine.validator.js';
import { addMedicineController, getMedicineByIdController, getMedicinesController } from '../controllers/medicine.controller.js';
import { upload } from '../utils/multer.js';

const router=express.Router()

router.post(
  "/",
  authenticate,

  upload.array("images", 5),
  parseAddMedicinePayload,
  validateAddMedicine,
  addMedicineController
)
.get("/", getMedicinesController)
.get("/:medicineId", getMedicineByIdController)

export default router;