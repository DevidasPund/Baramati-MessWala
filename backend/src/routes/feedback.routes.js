import { Router } from 'express';
import {
  submitFeedback,
  getFeedback,
  submitComplaint,
  resolveComplaint,
  getComplaints,
} from '../controllers/feedback.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Feedback
router.post('/feedback', authenticate, submitFeedback);
router.get('/feedback', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getFeedback);

// Complaints
router.post('/complaints', authenticate, submitComplaint);
router.get('/complaints', authenticate, getComplaints);
router.put('/complaints/:id/resolve', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), resolveComplaint);

export default router;
