import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllSurgeries,
  getSurgeryById,
  createSurgery,
  updateSurgery,
  updateSurgeryStatus,
  deleteSurgery,
  getSurgeonUpcomingSurgeries,
  getPatientSurgeries,
} from '../controllers/surgery.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all surgeries with filters
router.get('/', getAllSurgeries);

// Get upcoming surgeries for a surgeon
router.get('/surgeon/:surgeonId/upcoming', getSurgeonUpcomingSurgeries);

// Get patient surgeries
router.get('/patient/:patientId', getPatientSurgeries);

// Get surgery by ID
router.get('/:id', getSurgeryById);

// Create surgery
router.post('/', createSurgery);

// Update surgery
router.patch('/:id', updateSurgery);

// Update surgery status
router.patch('/:id/status', updateSurgeryStatus);

// Delete surgery
router.delete('/:id', deleteSurgery);

export default router;
