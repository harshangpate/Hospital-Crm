import express from 'express';
import {
  createRadiologyTest,
  getRadiologyTests,
  getRadiologyTestById,
  updateRadiologyTestStatus,
  submitRadiologyReport,
  approveRadiologyReport,
  rejectRadiologyReport,
  getRadiologyStats,
  deleteRadiologyTest,
} from '../controllers/radiologyTest.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get radiology statistics
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getRadiologyStats);

// Get all radiology tests with filters
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getRadiologyTests);

// Create new radiology test order
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), createRadiologyTest);

// Get specific radiology test
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getRadiologyTestById);

// Update radiology test status
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), updateRadiologyTestStatus);

// Submit radiology report (Radiologist)
router.post('/:id/report', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), submitRadiologyReport);

// Approve radiology report (Senior Radiologist)
router.post('/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), approveRadiologyReport);

// Reject radiology report
router.post('/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), rejectRadiologyReport);

// Delete radiology test
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteRadiologyTest);

export default router;
