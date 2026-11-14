import { Router } from 'express';
import {
  bookExtraMeal,
  createMealRequest,
  updateExtraMealStatus,
  updateMealRequestStatus,
  getExtraMeals,
  getMealRequests,
} from '../controllers/extraMeal.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Extra meals
router.get('/', authenticate, getExtraMeals);
router.post('/book', authenticate, bookExtraMeal);
router.put('/:id/status', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), updateExtraMealStatus);

// Skip / Pause Requests
router.get('/requests', authenticate, getMealRequests);
router.post('/requests', authenticate, createMealRequest);
router.put('/requests/:id/status', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), updateMealRequestStatus);

export default router;
