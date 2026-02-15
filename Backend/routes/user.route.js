import express from "express";
import {  createUserController, getAllDoctorsController, getAllUserController } from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";


const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("user.read.all"),
  getAllUserController
)
.post('/',authenticate,authorize("user.create"),createUserController)
.get('/doctors',authenticate,getAllDoctorsController)

export default router;
