import { Router } from "express";
import { login, register, resendOtp, verifyOtp } from "../controllers/auth.controller.js";


const router = Router();

router.post('/register', register);
router.post('/verifyotp', verifyOtp);
router.post('/resendOtp', resendOtp);
router.post('/login', login);

export default router;