import express from 'express';
import {
  createImagingCatalog,
  getImagingCatalog,
  getImagingCatalogById,
  updateImagingCatalog,
  deleteImagingCatalog,
  toggleImagingCatalogStatus,
  getImagingCatalogStats,
} from '../controllers/imagingCatalog.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), getImagingCatalogStats);

// CRUD operations
router.get('/', getImagingCatalog);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createImagingCatalog);
router.get('/:id', getImagingCatalogById);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateImagingCatalog);
router.patch('/:id/toggle', authorize('SUPER_ADMIN', 'ADMIN'), toggleImagingCatalogStatus);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteImagingCatalog);

export default router;
