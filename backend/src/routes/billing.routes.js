import { Router } from 'express';
import {
  generateMonthlyBills,
  getInvoices,
  getInvoiceById,
  downloadInvoicePdf,
} from '../controllers/billing.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/generate', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), generateMonthlyBills);
router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoiceById);
router.get('/:id/pdf', authenticate, downloadInvoicePdf);

export default router;
