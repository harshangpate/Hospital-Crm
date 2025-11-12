import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPreOpChecklistBySurgeryId,
  upsertPreOpChecklist,
  deletePreOpChecklist,
  getIntraOpRecordBySurgeryId,
  upsertIntraOpRecord,
  getPostOpRecordBySurgeryId,
  upsertPostOpRecord,
} from '../controllers/surgeryRecords.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== PRE-OP CHECKLIST ROUTES ====================

// Get pre-op checklist by surgery ID
router.get('/pre-op/:surgeryId', getPreOpChecklistBySurgeryId);

// Create or update pre-op checklist
router.put('/pre-op/:surgeryId', upsertPreOpChecklist);

// Delete pre-op checklist
router.delete('/pre-op/:surgeryId', deletePreOpChecklist);

// ==================== INTRA-OP RECORD ROUTES ====================

// Get intra-op record by surgery ID
router.get('/intra-op/:surgeryId', getIntraOpRecordBySurgeryId);

// Create or update intra-op record
router.put('/intra-op/:surgeryId', upsertIntraOpRecord);

// ==================== POST-OP RECORD ROUTES ====================

// Get post-op record by surgery ID
router.get('/post-op/:surgeryId', getPostOpRecordBySurgeryId);

// Create or update post-op record
router.put('/post-op/:surgeryId', upsertPostOpRecord);

export default router;
