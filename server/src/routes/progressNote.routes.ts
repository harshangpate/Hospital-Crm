import express from 'express';
import {
  createProgressNote,
  getProgressNotesByAdmission,
  getProgressNotesByPatient,
  getProgressNoteById,
  updateProgressNote,
  deleteProgressNote,
  getProgressNoteStats,
} from '../controllers/progressNote.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get statistics for admission progress notes
router.get(
  '/admission/:admissionId/stats',
  authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'),
  getProgressNoteStats
);

// Get all progress notes for an admission (with filters)
router.get(
  '/admission/:admissionId',
  authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'),
  getProgressNotesByAdmission
);

// Get all progress notes for a patient
router.get(
  '/patient/:patientId',
  authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'),
  getProgressNotesByPatient
);

// Create new progress note
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'),
  createProgressNote
);

// Get single progress note by ID
router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'),
  getProgressNoteById
);

// Update progress note
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'),
  updateProgressNote
);

// Delete progress note
router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'),
  deleteProgressNote
);

export default router;
