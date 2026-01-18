import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPayrollRecords,
  processPayroll,
  markAsPaid,
  getPayrollStats,
  getPayrollHistory,
} from '../controllers/payroll.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', getPayrollRecords);
router.post('/process', processPayroll);
router.post('/:id/mark-paid', markAsPaid);
router.get('/stats', getPayrollStats);
router.get('/history/:staffId', getPayrollHistory);

export default router;
