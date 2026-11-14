import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  regenerateQrToken,
  getMyDashboardStats,
} from '../controllers/customer.controller.js';
import { authenticate, authorize, verifyCustomerOwnership } from '../middleware/auth.js';

const router = Router();

router.get('/me/dashboard', authenticate, getMyDashboardStats);
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'STAFF']), getCustomers);
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), createCustomer);
router.get('/:id', authenticate, verifyCustomerOwnership, getCustomerById);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), updateCustomer);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), deleteCustomer);
router.post('/:id/regenerate-qr', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), regenerateQrToken);

export default router;
