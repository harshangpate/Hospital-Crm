import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  scheduleMaintenance,
  incrementUsage,
} from '../controllers/equipment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all equipment
router.get('/', getAllEquipment);

// Get equipment by ID
router.get('/:id', getEquipmentById);

// Create equipment
router.post('/', createEquipment);

// Update equipment
router.patch('/:id', updateEquipment);

// Delete equipment
router.delete('/:id', deleteEquipment);

// Schedule maintenance
router.post('/:id/maintenance', scheduleMaintenance);

// Increment usage count
router.post('/:id/usage', incrementUsage);

export default router;
