import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
  getBillingStats,
  addInvoiceItems,
  updateDailyBedCharges,
  downloadInvoicePDF,
  emailInvoice,
} from '../controllers/billing.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get billing statistics
router.get('/stats', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), getBillingStats);

// Update daily bed charges for active admissions
router.post('/update-bed-charges', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), updateDailyBedCharges);

// Get all invoices
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), getAllInvoices);

// Get invoice by ID
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'DOCTOR'), getInvoiceById);

// Download invoice as PDF
router.get('/:id/pdf', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'DOCTOR'), downloadInvoicePDF);

// Send invoice via email
router.post('/:id/email', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), emailInvoice);

// Create new invoice
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), createInvoice);

// Add items to invoice
router.post('/:id/items', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), addInvoiceItems);

// Record payment
router.post('/:id/payment', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), recordPayment);

export default router;
