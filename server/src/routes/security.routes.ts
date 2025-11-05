import { Router } from 'express';
import {
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  updateSecuritySettings,
  getSecuritySettings,
} from '../controllers/security.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Two-Factor Authentication routes
router.post('/2fa/enable', enableTwoFactor);
router.post('/2fa/verify', verifyTwoFactor);
router.post('/2fa/disable', disableTwoFactor);
router.get('/2fa/status', getTwoFactorStatus);

// Security Settings routes
router.get('/settings', getSecuritySettings);
router.put('/settings', updateSecuritySettings);

export default router;
