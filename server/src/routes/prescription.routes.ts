import express from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  cancelPrescription,
  dispensePrescription,
  requestRefill,
  searchMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  downloadPrescriptionPDF,
  emailPrescription
} from '../controllers/prescription.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Prescription Routes
router.get('/', authenticate, getPrescriptions);
router.get('/:id', authenticate, getPrescriptionById);
router.get('/:id/download', authenticate, downloadPrescriptionPDF);
router.post('/:id/email', authenticate, emailPrescription);
router.post('/', authenticate, authorize('DOCTOR'), createPrescription);
router.put('/:id', authenticate, authorize('DOCTOR'), updatePrescription);
router.post('/:id/cancel', authenticate, authorize('DOCTOR'), cancelPrescription);
router.post('/:id/dispense', authenticate, authorize('PHARMACIST'), dispensePrescription);
router.post('/:id/refill', authenticate, requestRefill);

// Patient & Doctor Prescriptions
router.get('/patients/:patientId', authenticate, getPatientPrescriptions);
router.get('/doctors/:doctorId', authenticate, getDoctorPrescriptions);

// Medication Routes
router.get('/medications/search', authenticate, searchMedications);
router.get('/medications/:id', authenticate, getMedicationById);
router.post('/medications', authenticate, authorize('ADMIN', 'PHARMACIST'), createMedication);
router.put('/medications/:id', authenticate, authorize('ADMIN', 'PHARMACIST'), updateMedication);

export default router;
