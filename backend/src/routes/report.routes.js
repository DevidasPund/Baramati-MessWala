import { Router } from 'express';
import { getAnalyticsReport, exportReportExcel } from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/analytics', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getAnalyticsReport);
router.get('/export/excel', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), exportReportExcel);

export default router;
