import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  processPayment,
  getPaymentHistory,
  getOutstandingBalances,
  getInvoiceStats,
  generateInvoiceFromAppointment,
  downloadInvoicePDF,
  emailInvoice,
} from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Invoice CRUD
router.post('/', authorize('ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT'), createInvoice);
router.get('/', getInvoices);
router.get('/stats', getInvoiceStats);
router.get('/outstanding', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), getOutstandingBalances);
router.get('/:id', getInvoiceById);
router.get('/:id/download', downloadInvoicePDF);
router.post('/:id/email', emailInvoice);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), updateInvoice);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteInvoice);

// Payment operations
router.post('/:id/payment', authorize('ADMIN', 'SUPER_ADMIN', 'NURSE', 'ACCOUNTANT'), processPayment);
router.get('/patient/:patientId/history', getPaymentHistory);

// Generate invoice from appointment
router.post('/generate/appointment/:appointmentId', authorize('ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT'), generateInvoiceFromAppointment);

export default router;
