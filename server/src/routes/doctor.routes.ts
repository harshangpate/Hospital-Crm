import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDoctorById,
  getDoctorsBySpecialty,
  getAvailableSlots,
  getSpecializations,
  updateDoctorAvailability,
  getMyAvailability,
  setWeeklySchedule,
  getWeeklySchedule,
  addBlockedSlot,
  getBlockedSlots,
  deleteBlockedSlot,
} from '../controllers/doctor.controller';

const router = Router();

// Public routes (no auth required)
router.get('/specializations', getSpecializations);
router.get('/by-specialty', getDoctorsBySpecialty);

// Protected routes (auth required)
router.use(authenticate);

// IMPORTANT: Specific routes must come before parameterized routes
router.get('/available-slots', getAvailableSlots);
router.get('/my-availability', authorize('DOCTOR'), getMyAvailability);
router.put('/my-availability', authorize('DOCTOR'), updateDoctorAvailability);

router.get('/weekly-schedule', authorize('DOCTOR'), getWeeklySchedule);
router.post('/weekly-schedule', authorize('DOCTOR'), setWeeklySchedule);

router.get('/blocked-slots', authorize('DOCTOR'), getBlockedSlots);
router.post('/blocked-slots', authorize('DOCTOR'), addBlockedSlot);
router.delete('/blocked-slots/:id', authorize('DOCTOR'), deleteBlockedSlot);

// Parameterized route - must be last
router.get('/:id', getDoctorById);

export default router;
