import { Router } from 'express';
import {
  getActiveMessQrSession,
  scanMessQrByCustomer,
  scanCustomerQrByStaff,
  recordManualAttendance,
  deleteAttendance,
  getAttendanceList,
  exportAttendanceExcel,
} from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Mess QR Dynamic Session (Method A)
router.get('/mess-qr-session', authenticate, getActiveMessQrSession);
router.post('/scan-mess-qr', authenticate, scanMessQrByCustomer);

// Staff Scans Customer QR (Method B)
router.post('/scan-customer-qr', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'STAFF']), scanCustomerQrByStaff);

// List & Manual operations
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'STAFF']), getAttendanceList);
router.post('/manual', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), recordManualAttendance);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), deleteAttendance);
router.get('/export/excel', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'STAFF']), exportAttendanceExcel);

export default router;
