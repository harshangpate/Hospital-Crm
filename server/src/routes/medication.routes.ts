import { Router } from 'express';
import { createMedication, getMedications } from '../controllers/medication.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'DOCTOR'),
  createMedication
);

router.get(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE'),
  getMedications
);

export default router;
