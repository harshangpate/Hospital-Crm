import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLeaves,
  applyLeave,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  getLeaveStats,
  getLeaveHistory,
  cancelLeave,
} from '../controllers/leave.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all leave requests (with optional filters)
router.get('/', getLeaves);

// Apply for leave
router.post('/apply', applyLeave);

// Approve leave request
router.post('/:id/approve', approveLeave);

// Reject leave request
router.post('/:id/reject', rejectLeave);

// Cancel leave request
router.post('/:id/cancel', cancelLeave);

// Get leave balance for a staff member
router.get('/balance/:staffId', getLeaveBalance);

// Get leave statistics
router.get('/stats', getLeaveStats);

// Get leave history for a staff member
router.get('/history/:staffId', getLeaveHistory);

export default router;
