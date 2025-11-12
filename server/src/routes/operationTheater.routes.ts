import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllOperationTheaters,
  getOperationTheaterById,
  createOperationTheater,
  updateOperationTheater,
  updateOTStatus,
  deleteOperationTheater,
  getOTSchedule,
  getOTAvailability,
  getOTDashboardStats,
  addMaintenanceLog,
} from '../controllers/operationTheater.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get OT dashboard stats
router.get('/stats', getOTDashboardStats);

// Get OT availability
router.get('/availability', getOTAvailability);

// Get all operation theaters
router.get('/', getAllOperationTheaters);

// Get OT schedule
router.get('/schedule', getOTSchedule);

// Get OT by ID
router.get('/:id', getOperationTheaterById);

// Create operation theater
router.post('/', createOperationTheater);

// Update operation theater
router.patch('/:id', updateOperationTheater);

// Update OT status
router.patch('/:id/status', updateOTStatus);

// Delete operation theater
router.delete('/:id', deleteOperationTheater);

// Add maintenance log
router.post('/:otId/maintenance', addMaintenanceLog);

export default router;
