import { Router } from 'express';
import {
  getAttendance,
  markAttendance,
  markBulkAttendance,
  getAttendanceStats,
  getMonthlyAttendance
} from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get attendance records
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), getAttendance);

// Get attendance statistics
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), getAttendanceStats);

// Get monthly attendance for a staff member
router.get('/monthly', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), getMonthlyAttendance);

// Mark attendance
router.post('/mark', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECEPTIONIST'), markAttendance);

// Mark bulk attendance
router.post('/mark-bulk', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), markBulkAttendance);

export default router;
