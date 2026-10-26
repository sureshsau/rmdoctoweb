import express from 'express';
import {
    createPackage,
    updatePackage,
    deletePackage,
    getAllPackages,
    getPackageById
} from '../controllers/medicalTourism.controller.js';
import { authenticate, authorize, isAdminOrSubadmin } from '../middlewares/auth.middlewire.js';

const router = express.Router();

// Admin routes (Create, Update, Delete)
router.post(
    '/',
    authenticate,
    isAdminOrSubadmin,
    createPackage
);

router.put(
    '/:id',
    authenticate,
    isAdminOrSubadmin,
    updatePackage
);

router.delete(
    '/:id',
    authenticate,
    isAdminOrSubadmin,
    deletePackage
);

// Public / User routes (Read)
router.get(
    '/',
    getAllPackages
);

router.get(
    '/:id',
    getPackageById
);

export default router;
