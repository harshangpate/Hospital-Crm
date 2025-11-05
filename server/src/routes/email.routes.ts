import express from 'express';
import { sendTestEmail, sendBulkEmail } from '../controllers/email.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Test email endpoint (Admin only)
router.post('/test', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), sendTestEmail);

// Bulk email endpoint (Admin only)
router.post('/send-bulk', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), sendBulkEmail);

export default router;
