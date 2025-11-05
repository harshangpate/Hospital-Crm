import express from 'express';
import {
    createLabTest,
    getLabTests,
    getLabTestById,
    updateLabTestStatus,
    submitLabResults,
    getLabStats,
    getLabAnalytics,
    deleteLabTest,
    confirmLabTest,
    approveLabTestResults,
    rejectLabTestResults,
} from '../controllers/labTest.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get lab statistics (dashboard)
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT'), getLabStats);

// Get lab analytics (charts data)
router.get('/analytics', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT'), getLabAnalytics);

// Get all lab tests with filters (patients can view their own tests)
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'), getLabTests);

// Create new lab test order
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN'), createLabTest);

// Get specific lab test (patients can view their own test details)
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'NURSE', 'PATIENT'), getLabTestById);

// Confirm lab test (Lab Technician confirms doctor's order)
router.post('/:id/confirm', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'), confirmLabTest);

// Update lab test status (sample collection, etc.)
router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'), updateLabTestStatus);

// Submit lab test results
router.post('/:id/results', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'), submitLabResults);

// Approve lab test results (Senior Lab Tech / Pathologist)
router.post('/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'), approveLabTestResults);

// Reject lab test results and send back for corrections
router.post('/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'), rejectLabTestResults);

// Delete lab test
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteLabTest);

export default router;
