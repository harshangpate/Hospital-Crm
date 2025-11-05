import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentStats,
} from '../controllers/appointment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get appointment statistics (Dashboard)
router.get('/stats', getAppointmentStats);

// Create appointment (Patient)
router.post('/', createAppointment);

// Get appointments (with filters)
router.get('/', getAppointments);

// Get appointment by ID
router.get('/:id', getAppointmentById);

// Update appointment status (Doctor/Admin)
router.patch('/:id/status', updateAppointmentStatus);

// Cancel appointment
router.post('/:id/cancel', cancelAppointment);

// Reschedule appointment
router.post('/:id/reschedule', rescheduleAppointment);

export default router;
