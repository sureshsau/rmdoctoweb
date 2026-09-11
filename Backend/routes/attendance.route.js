import express from 'express';
import { authenticate, authorize, isOwnerOrAdmin } from '../middlewares/auth.middlewire.js';
import {
  getAttendanceSettingsController,
  registerFaceEmbeddingController,
  setAttendanceSettingsForAllUsersController,
  setupUserAttendanceController,
  markAttendanceByFaceController,
  getMyAttendanceLogsController,
  getAttendanceLogsForUserController,
  getAllAttendanceLogsController,
  exportAttendanceCsvController
} from '../controllers/attendance.controller.js';
import { upload } from '../utils/multer.js';
import { attendanceSettingsValidationRules, parseAttendancePayload, validateAttendanceSettings } from '../validator/attendance/attendanceSettings.validator.js';

const router = express.Router();

// ── SELF-SERVICE ──────────────────────────────────────────────────────────────
// Mark own attendance
router.post('/mark', authenticate, upload.single('faceImage'), markAttendanceByFaceController);

// View own attendance logs
router.get('/log/me', authenticate, getMyAttendanceLogsController);

// ── OWNER OR ADMIN (user sees their own, admin sees anyone's) ─────────────────
router.get('/log/:userId', authenticate, isOwnerOrAdmin('userId'), getAttendanceLogsForUserController);

// ── ADMIN / PERMISSION-GATED ──────────────────────────────────────────────────
// Setup attendance for a user (admin/subadmin only)
router.post(
  '/setup/:userId',
  authenticate,
  authorize('attendance.setup'),
  upload.single('faceImage'),
  parseAttendancePayload,
  attendanceSettingsValidationRules,
  validateAttendanceSettings,
  setupUserAttendanceController
);

// View attendance settings -- own, or everyone's if full-access/permitted
router.get('/settings', authenticate, getAttendanceSettingsController);

// Bulk-apply shift/geofence settings to every employee-role user (admin only)
router.post('/setAttendanceSettings', authenticate, authorize('attendance.setup'), setAttendanceSettingsForAllUsersController);

// All-staff attendance report (admin) -- paginated, filterable by date/role/status/search
router.get('/admin/all', authenticate, authorize('attendance.read.all'), getAllAttendanceLogsController);

// CSV export of the same report, unpaginated
router.get('/admin/export', authenticate, authorize('attendance.read.all'), exportAttendanceCsvController);

export default router;
