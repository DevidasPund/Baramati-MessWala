import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { generateToken } from '../utils/tokens.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { whatsappService } from '../integrations/whatsapp.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        customer: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        staff: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact administration.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await logAudit(user.id, 'USER_LOGIN', 'User', user.id, { role: user.role }, req);

    return successResponse(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customer: user.customer,
        staff: user.staff,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, password, address, emergencyContact, planId } = req.body;

    if (!name || !phone || !email || !password) {
      return errorResponse(res, 'Name, phone, email, and password are required.', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    // Check existing user or phone
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    const existingPhone = await prisma.customer.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) {
      return errorResponse(res, 'An account with this phone number already exists.', 409);
    }

    // Generate unique customer code
    const count = await prisma.customer.count();
    const customerCode = `BMW-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const qrToken = 'bmw_qr_' + crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: 'CUSTOMER',
          isActive: true,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerCode,
          name,
          phone: cleanPhone,
          email: cleanEmail,
          address,
          emergencyContact,
          status: 'ACTIVE',
          qrToken,
        },
      });

      // If user selected an initial plan during registration
      let initialSubscription = null;
      if (planId) {
        const plan = await tx.subscriptionPlan.findUnique({ where: { id: planId } });
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.durationDays);

          initialSubscription = await tx.subscription.create({
            data: {
              customerId: customer.id,
              planId: plan.id,
              startDate,
              endDate,
              amount: plan.price,
              status: 'PENDING', // Pending payment
            },
          });
        }
      }

      return { user, customer, initialSubscription };
    }, { maxWait: 15000, timeout: 35000 });

    // Send Welcome WhatsApp notification
    whatsappService.sendNotification({
      customerId: result.customer.id,
      phone: result.customer.phone,
      templateType: 'WELCOME',
      data: {
        customerName: result.customer.name,
        customerCode: result.customer.customerCode,
      },
    }).catch(err => console.error('Notification dispatch error:', err));

    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return successResponse(res, 'Registration successful. Welcome to Baramati Messwala!', {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        customer: result.customer,
      },
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customer: {
          include: {
            subscriptions: {
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        staff: true,
      },
    });

    return successResponse(res, 'Profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, emergencyContact } = req.body;
    const userId = req.user.id;

    if (req.user.role === 'CUSTOMER' && req.user.customer) {
      const updatedCustomer = await prisma.customer.update({
        where: { id: req.user.customer.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(emergencyContact && { emergencyContact }),
        },
      });
      return successResponse(res, 'Profile updated successfully', { customer: updatedCustomer });
    }

    return successResponse(res, 'Profile updated', { user: req.user });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Return success anyway for security timing
      return successResponse(res, 'If an account exists with this email, a reset link will be sent.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log(`[PASSWORD RESET TOKEN] For ${user.email}: token=${token}`);

    return successResponse(res, 'Password reset instructions have been generated.', {
      resetToken: token, // exposed for testing / local demo
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return errorResponse(res, 'Token and new password are required', 400);
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return errorResponse(res, 'Invalid or expired password reset token.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return successResponse(res, 'Password has been reset successfully. You can now login.');
  } catch (error) {
    next(error);
  }
};
