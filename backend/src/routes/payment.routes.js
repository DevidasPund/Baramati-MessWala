import { Router } from 'express';
import {
  createPayment,
  verifyPayment,
  getPayments,
  getPaymentManagementStats,
  recordManualOwnerPayment,
  toggleInvoiceStatus,
  getCustomerPaymentHistory,
} from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/stats', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getPaymentManagementStats);
router.get('/customer/:customerId/history', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getCustomerPaymentHistory);
router.post('/manual-record', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), recordManualOwnerPayment);
router.put('/invoice/:invoiceId/status', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), toggleInvoiceStatus);

router.get('/', authenticate, getPayments);
router.post('/', authenticate, upload.single('screenshot'), createPayment);
router.put('/:id/verify', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), verifyPayment);

export default router;
