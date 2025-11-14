import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats,
  resetUserPassword
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's profile (any authenticated user)
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Get all users - allow various roles to view (needed for prescriptions/medical records/billing/lab tests)
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT', 'LAB_TECHNICIAN'), getAllUsers);

// Stats route - must be before /:id to avoid matching "stats" as an id parameter
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), getUserStats);

router.get('/:id', getUserById);

// Admin-only routes
router.use(authorize('ADMIN', 'SUPER_ADMIN'));
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);
router.patch('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
