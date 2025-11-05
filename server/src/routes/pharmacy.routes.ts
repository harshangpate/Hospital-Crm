import { Router } from 'express';
import {
  getPendingPrescriptions,
  getPrescriptionById,
  dispensePrescription,
  getInventory,
  updateInventory,
  updateInventoryById,
  getPharmacyStats,
  getDispensedPrescriptions,
} from '../controllers/pharmacy.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Pharmacy statistics
router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'),
  getPharmacyStats
);

// Get pending prescriptions (ISSUED status)
router.get(
  '/prescriptions/pending',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'),
  getPendingPrescriptions
);

// Get dispensed prescriptions history
router.get(
  '/prescriptions/dispensed',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'),
  getDispensedPrescriptions
);

// Get prescription by ID
router.get(
  '/prescriptions/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE'),
  getPrescriptionById
);

// Dispense prescription
router.post(
  '/prescriptions/:id/dispense',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'),
  dispensePrescription
);

// Inventory management
router.get(
  '/inventory',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'),
  getInventory
);

router.post(
  '/inventory',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'),
  updateInventory
);

router.put(
  '/inventory/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'),
  updateInventoryById
);

export default router;
