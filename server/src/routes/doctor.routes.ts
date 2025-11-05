import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
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
router.get('/available-slots', getAvailableSlots);
router.get('/my-availability', authorize('DOCTOR'), getMyAvailability);
router.put('/my-availability', authorize('DOCTOR'), updateDoctorAvailability);

// Weekly schedule routes
router.get('/weekly-schedule', authorize('DOCTOR'), getWeeklySchedule);
router.post('/weekly-schedule', authorize('DOCTOR'), setWeeklySchedule);

// Blocked slots routes
router.get('/blocked-slots', authorize('DOCTOR'), getBlockedSlots);
router.post('/blocked-slots', authorize('DOCTOR'), addBlockedSlot);
router.delete('/blocked-slots/:id', authorize('DOCTOR'), deleteBlockedSlot);

export default router;
