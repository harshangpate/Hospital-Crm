import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  registerEmergencyVisit,
  createTriageAssessment,
  getTriageByVisit,
  getEmergencyQueue,
  assignDoctor,
  assignBed,
  getEmergencyBeds,
  updateDoctorAssessment,
  recordEmergencyVitals,
  getVisitVitals,
  createDisposition,
  getEmergencyVisitById,
  getEmergencyStatistics,
  updateVisitStatus,
} from '../controllers/emergency.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Registration
router.post('/register', registerEmergencyVisit);

// Queue Management
router.get('/queue', getEmergencyQueue);
router.get('/statistics', getEmergencyStatistics);

// Visit Details
router.get('/:emergencyVisitId', getEmergencyVisitById);
router.patch('/:emergencyVisitId/status', updateVisitStatus);

// Triage
router.post('/:emergencyVisitId/triage', createTriageAssessment);
router.get('/:emergencyVisitId/triage', getTriageByVisit);

// Doctor & Bed Assignment
router.post('/:emergencyVisitId/assign-doctor', assignDoctor);
router.post('/:emergencyVisitId/assign-bed', assignBed);

// Doctor Assessment
router.patch('/:emergencyVisitId/assessment', updateDoctorAssessment);

// Vitals
router.post('/:emergencyVisitId/vitals', recordEmergencyVitals);
router.get('/:emergencyVisitId/vitals', getVisitVitals);

// Disposition
router.post('/:emergencyVisitId/disposition', createDisposition);

// Bed Management
router.get('/beds/all', getEmergencyBeds);

export default router;
