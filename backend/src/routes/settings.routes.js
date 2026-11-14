import { Router } from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
} from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public
router.get('/public', getPublicSettings);

// Admin
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getAdminSettings);
router.put('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), upload.single('upiQrImage'), updateSettings);

export default router;
