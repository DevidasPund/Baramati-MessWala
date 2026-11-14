import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard-stats', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getDashboardStats);

export default router;
