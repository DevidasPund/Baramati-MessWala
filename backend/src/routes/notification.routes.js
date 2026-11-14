import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  sendAnnouncement,
} from '../controllers/notification.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.post('/broadcast', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), sendAnnouncement);

export default router;
