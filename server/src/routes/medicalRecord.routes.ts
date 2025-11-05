import express from 'express';
import {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  createVitalSigns,
  getPatientVitalSigns,
  createAllergy,
  getPatientAllergies,
  updateAllergy,
  getPatientMedicalHistory,
  createMedicalHistory,
  uploadDocument,
  getPatientDocuments,
  deleteDocument,
  downloadMedicalRecordPDF,
  emailMedicalRecord
} from '../controllers/medicalRecord.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Medical Records Routes
router.get('/', authenticate, getMedicalRecords);
router.get('/:id', authenticate, getMedicalRecordById);
router.get('/:id/download', authenticate, downloadMedicalRecordPDF);
router.post('/:id/email', authenticate, emailMedicalRecord);
router.post('/', authenticate, authorize('DOCTOR'), createMedicalRecord);
router.put('/:id', authenticate, authorize('DOCTOR'), updateMedicalRecord);
router.delete('/:id', authenticate, authorize('DOCTOR', 'ADMIN'), deleteMedicalRecord);

// Vital Signs Routes
router.post('/vital-signs', authenticate, authorize('DOCTOR', 'NURSE'), createVitalSigns);
router.get('/patients/:patientId/vital-signs', authenticate, getPatientVitalSigns);

// Allergies Routes
router.post('/allergies', authenticate, authorize('DOCTOR'), createAllergy);
router.get('/patients/:patientId/allergies', authenticate, getPatientAllergies);
router.put('/allergies/:id', authenticate, authorize('DOCTOR'), updateAllergy);

// Medical History Routes
router.get('/patients/:patientId/history', authenticate, getPatientMedicalHistory);
router.post('/history', authenticate, authorize('DOCTOR'), createMedicalHistory);

// Documents Routes
router.post('/documents', authenticate, uploadDocument);
router.get('/patients/:patientId/documents', authenticate, getPatientDocuments);
router.delete('/documents/:id', authenticate, authorize('DOCTOR', 'ADMIN'), deleteDocument);

export default router;
