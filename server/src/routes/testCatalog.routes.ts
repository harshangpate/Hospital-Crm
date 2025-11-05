import express from 'express';
import {
  createTestCatalog,
  getAllTestCatalogs,
  getTestCatalogById,
  updateTestCatalog,
  deleteTestCatalog,
  getTestCategories,
  getCatalogStats,
  bulkImportTests,
} from '../controllers/testCatalog.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes

// Get statistics
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'), getCatalogStats);

// Get categories
router.get('/categories', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN'), getTestCategories);

// Bulk import tests
router.post('/bulk-import', authorize('SUPER_ADMIN', 'ADMIN'), bulkImportTests);

// CRUD operations
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN'), getAllTestCatalogs);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN'), getTestCatalogById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createTestCatalog);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateTestCatalog);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteTestCatalog);

export default router;
