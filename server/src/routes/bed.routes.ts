import express from 'express';
import {
  // Ward Management
  createWard,
  getWards,
  getWardById,
  updateWard,
  deleteWard,
  // Bed Management
  createBed,
  getBeds,
  getBedById,
  updateBed,
  deleteBed,
  getBedStats,
  syncBedStatuses,
  createMissingBeds,
} from '../controllers/bed.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ====================
// BED STATISTICS
// ====================
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getBedStats);

// Sync bed statuses with actual admissions (fix orphaned beds)
router.post('/sync-statuses', authorize('SUPER_ADMIN', 'ADMIN'), syncBedStatuses);

// Create missing beds for wards
router.post('/create-missing-beds', authorize('SUPER_ADMIN', 'ADMIN'), createMissingBeds);

// ====================
// WARD ROUTES
// ====================

// Get all wards
router.get('/wards', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), getWards);

// Create new ward
router.post('/wards', authorize('SUPER_ADMIN', 'ADMIN'), createWard);

// Get ward by ID
router.get('/wards/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getWardById);

// Update ward
router.put('/wards/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateWard);

// Delete ward
router.delete('/wards/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteWard);

// ====================
// BED ROUTES
// ====================

// Get all beds
router.get('/beds', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), getBeds);

// Create new bed
router.post('/beds', authorize('SUPER_ADMIN', 'ADMIN'), createBed);

// Get bed by ID
router.get('/beds/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'), getBedById);

// Update bed
router.put('/beds/:id', authorize('SUPER_ADMIN', 'ADMIN', 'NURSE'), updateBed);

// Delete bed
router.delete('/beds/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteBed);

export default router;
