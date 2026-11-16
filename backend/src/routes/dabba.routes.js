import { Router } from 'express';
import {
  getDailyDabbaList,
  markDabbaGiven,
  markDabbaReturned,
  markDabbaPrepared,
  batchPrepareDabbas,
  correctDabbaRecord,
  getMyDabbaHistory,
} from '../controllers/dabba.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Owner only endpoints
router.get('/daily', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), getDailyDabbaList);
router.post('/mark-given', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), markDabbaGiven);
router.post('/mark-returned', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), markDabbaReturned);
router.post('/prepare', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), markDabbaPrepared);
router.post('/batch-prepare', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), batchPrepareDabbas);
router.put('/:id/correction', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), correctDabbaRecord);

// Customer endpoint
router.get('/my-history', authenticate, getMyDabbaHistory);

export default router;
