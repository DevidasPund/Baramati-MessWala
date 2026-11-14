import { Router } from 'express';
import {
  createPayment,
  verifyPayment,
  getPayments,
} from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', authenticate, getPayments);
router.post('/', authenticate, upload.single('screenshot'), createPayment);
router.put('/:id/verify', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), verifyPayment);

export default router;
