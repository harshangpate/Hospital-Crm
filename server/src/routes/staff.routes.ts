import { Router } from 'express';
import {
  getAllStaff,
  getStaffById,
  getStaffByStaffId,
  getStaffStats,
  updateStaff,
  getDepartments
} from '../controllers/staff.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all staff - accessible by HR, Admin, and management roles
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), getAllStaff);

// Get staff statistics
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), getStaffStats);

// Get departments list
router.get('/departments', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), getDepartments);

// Get staff by ID
router.get('/id/:id', getStaffById);

// Get staff by staff ID
router.get('/staff-id/:staffId', getStaffByStaffId);

// Update staff - HR and Admin only
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'), updateStaff);

export default router;
