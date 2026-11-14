import { Router } from 'express';
import {
  getTodayMenu,
  getWeeklyMenu,
  getAllMenus,
  saveMenu,
  deleteMenu,
  broadcastMenu,
} from '../controllers/menu.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public endpoints
router.get('/today', getTodayMenu);
router.get('/weekly', getWeeklyMenu);

// Admin endpoints
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'STAFF']), getAllMenus);
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), upload.single('image'), saveMenu);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), deleteMenu);
router.post('/:id/broadcast', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), broadcastMenu);

export default router;
