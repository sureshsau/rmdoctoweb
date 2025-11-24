import { Router } from "express";
import { login, Register, verifyOtp } from "../controllers/user.controller.js";

const router = Router();

router.post('/register', Register);
router.post('/verifyotp', verifyOtp);
// router.post('/sendEmail', );
router.post('/login', login);

export default router;