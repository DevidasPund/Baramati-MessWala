import { Router } from 'express';
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions,
  assignSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
} from '../controllers/subscription.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public / Authenticated Plans
router.get('/plans', getPlans);
router.post('/plans', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), createPlan);
router.put('/plans/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), updatePlan);
router.delete('/plans/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), deletePlan);

// Subscriptions
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'STAFF']), getSubscriptions);
router.post('/assign', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), assignSubscription);
router.put('/:id/pause', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), pauseSubscription);
router.put('/:id/resume', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), resumeSubscription);
router.post('/:id/renew', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), renewSubscription);

export default router;
