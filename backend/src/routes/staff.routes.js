import { Router } from 'express';
import {
  getStaffMembers,
  createStaff,
  updateStaff,
  getStaffDashboard,
} from '../controllers/staff.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getStaffMembers);
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), createStaff);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), updateStaff);
router.get('/dashboard', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'STAFF']), getStaffDashboard);

export default router;
