import { Router } from 'express';
import {
  login,
  registerCustomer,
  firebasePhoneLogin,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/firebase-login', firebasePhoneLogin);
router.post('/register', registerCustomer);
router.post('/register-customer', registerCustomer);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.put('/update-profile', authenticate, updateProfile);

export default router;
