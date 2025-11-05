import express from 'express';
import {
  createAdmission,
  getAdmissions,
  getAdmissionById,
  updateAdmission,
  dischargePatient,
  transferPatient,
  getAdmissionStats,
  deleteAdmission,
} from '../controllers/admission.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get admission statistics (dashboard)
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getAdmissionStats);

// Get all admissions with filters
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), getAdmissions);

// Create new admission
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), createAdmission);

// Get admission by ID
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getAdmissionById);

// Update admission
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), updateAdmission);

// Discharge patient
router.post('/:id/discharge', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), dischargePatient);

// Transfer patient (to different bed/ward)
router.post('/:id/transfer', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), transferPatient);

// Delete admission
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteAdmission);

export default router;
