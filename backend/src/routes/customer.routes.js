import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  regenerateQrToken,
  getMyDashboardStats,
  verifyCustomerStatus,
  manualVerifyPhone,
  ownerResetCustomerPassword,
} from '../controllers/customer.controller.js';
import { authenticate, authorize, verifyCustomerOwnership } from '../middleware/auth.js';

const router = Router();

router.get('/me/dashboard', authenticate, getMyDashboardStats);
router.get('/my/dashboard', authenticate, getMyDashboardStats);
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getCustomers);
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), createCustomer);
router.get('/:id', authenticate, verifyCustomerOwnership, getCustomerById);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), updateCustomer);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), deleteCustomer);
router.post('/:id/regenerate-qr', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), regenerateQrToken);

// Owner verification and management
router.put('/:id/verify-status', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), verifyCustomerStatus);
router.post('/:id/manual-verify-phone', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), manualVerifyPhone);
router.post('/:id/reset-password', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), ownerResetCustomerPassword);

export default router;
