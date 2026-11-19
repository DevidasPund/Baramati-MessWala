import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { generateToken } from '../utils/tokens.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { whatsappService } from '../integrations/whatsapp.js';
import { firebaseAuth, isFirebaseInitialized } from '../config/firebase.js';

export const login = async (req, res, next) => {
  try {
    const identifier = (req.body.emailOrPhone || req.body.email || req.body.phone || req.body.mobileNumber || req.body.username || '').trim();
    const { password } = req.body;
    if (!identifier || !password) {
      return errorResponse(res, 'Email/Mobile number and password are required.', 400);
    }

    let user = null;
    if (identifier.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
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
    } else {
      // Support login via Customer Mobile Number or Customer Code
      const cleanPhone = identifier.replace(/[^0-9]/g, '');
      const cust = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: identifier },
            ...(cleanPhone ? [{ phone: { contains: cleanPhone.slice(-10) } }] : []),
            { customerCode: identifier.toUpperCase() },
          ],
        },
        include: {
          user: {
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
          },
        },
      });
      if (cust?.user) {
        user = cust.user;
      } else if (cleanPhone) {
        // Support Owner login via Owner Mobile Number
        const settings = await prisma.businessSettings.findFirst();
        const allowedOwnerPhones = [
          process.env.OWNER_PHONE,
          settings?.phone,
          '9822334455',
        ].filter(Boolean).map((p) => p.replace(/[^0-9]/g, '').slice(-10));

        if (allowedOwnerPhones.some((p) => cleanPhone.slice(-10) === p)) {
          user = await prisma.user.findFirst({
            where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
            include: { customer: true, staff: true },
          });
        }
      }
    }

    if (!user) {
      return errorResponse(res, 'Invalid mobile number/email or password.', 401);
    }

    // Role check: Only Owner and Customer roles are supported
    if (user.role === 'STAFF') {
      return errorResponse(res, 'कर्मचारी लॉगिन सुविधा बंद करण्यात आली आहे. फक्त मालक आणि ग्राहक लॉगिन उपलब्ध आहे.', 403);
    }

    if (!user.isActive) {
      return errorResponse(res, 'आपले खाते निष्क्रिय किंवा स्थगित केले आहे. कृपया व्यवस्थापकाशी संपर्क साधा.', 403);
    }

    // Customer status verification check
    if (user.role === 'CUSTOMER' && user.customer) {
      if (process.env.MANDATORY_PHONE_VERIFICATION === 'true' && !user.customer.phoneVerified) {
        return res.status(403).json({
          success: false,
          code: 'PHONE_VERIFICATION_REQUIRED',
          message: 'आपला मोबाइल नंबर अद्याप SMS OTP द्वारे प्रमाणित झालेला नाही. कृपया प्रथम मोबाइल पडताळणी पूर्ण करा.',
        });
      }
      if (user.customer.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          success: false,
          code: 'PENDING_APPROVAL',
          message: 'आपली नोंदणी यशस्वीरीत्या प्राप्त झाली आहे. मेस मालकाच्या मंजुरीनंतर आपले खाते सुरू केले जाईल.',
          customer: {
            name: user.customer.name,
            phone: user.customer.phone,
            status: user.customer.status,
          },
        });
      }
      if (user.customer.status === 'REJECTED') {
        return errorResponse(res, 'आपली नोंदणी नाकारण्यात आली आहे. कृपया मेस व्यवस्थापनाशी संपर्क साधा.', 403);
      }
      if (user.customer.status === 'SUSPENDED' || user.customer.status === 'INACTIVE') {
        return errorResponse(res, 'आपले खाते स्थगित करण्यात आले आहे. कृपया मेस व्यवस्थापनाशी संपर्क साधा.', 403);
      }
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
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerCustomer = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      password = 'Customer@123',
      address,
      emergencyContact,
      planId,
      firebaseUid,
      phoneVerified = false,
    } = req.body;

    if (!name || !phone) {
      return errorResponse(res, 'नाव आणि मोबाइल नंबर आवश्यक आहेत.', 400);
    }

    const cleanPhone = phone.trim();
    const cleanEmail = (email && email.trim())
      ? email.toLowerCase().trim()
      : `${cleanPhone.replace(/[^0-9]/g, '')}@customer.baramatimesswala.com`;

    // Check existing phone
    const existingPhone = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: { contains: cleanPhone.replace(/[^0-9]/g, '').slice(-10) } },
        ],
      },
    });
    if (existingPhone) {
      return errorResponse(res, 'या मोबाइल नंबरवर आधीच खाते अस्तित्वात आहे.', 409);
    }

    // Check existing email
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return errorResponse(res, 'या ईमेलवर खाते अस्तित्वात आहे.', 409);
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
          status: 'PENDING_APPROVAL', // New registrations require Owner approval
          firebaseUid: firebaseUid || null,
          phoneVerified: Boolean(phoneVerified || firebaseUid),
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
              status: 'PENDING', // Pending owner approval & payment
            },
          });
        }
      }

      return { user, customer, initialSubscription };
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(result.user.id, 'CUSTOMER_REGISTRATION_SUBMITTED', 'Customer', result.customer.id, {
      customerCode,
      phone: cleanPhone,
      status: 'PENDING_APPROVAL',
    }, req);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'आपली नोंदणी यशस्वीरीत्या प्राप्त झाली आहे. मेस मालकाच्या मंजुरीनंतर आपले खाते सुरू केले जाईल.',
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        phone: result.customer.phone,
        customerCode: result.customer.customerCode,
        status: result.customer.status,
      },
      data: {
        customer: result.customer,
        user: { id: result.user.id, email: result.user.email, role: result.user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Firebase Phone Authentication Login
export const firebasePhoneLogin = async (req, res, next) => {
  try {
    const { idToken, phoneNumber, role = 'CUSTOMER' } = req.body;

    // Disallow STAFF role
    if (role === 'STAFF') {
      return errorResponse(res, 'कर्मचारी लॉगिन सुविधा बंद करण्यात आली आहे. फक्त मालक आणि ग्राहक लॉगिन उपलब्ध आहे.', 403);
    }

    let verifiedPhone = null;
    let firebaseUid = null;

    if (isFirebaseInitialized && firebaseAuth) {
      if (!idToken) {
        return errorResponse(res, 'Firebase ID Token आवश्यक आहे. कृपया SMS OTP पडताळणी पूर्ण करा.', 400);
      }
      try {
        const decoded = await firebaseAuth.verifyIdToken(idToken);
        verifiedPhone = decoded.phone_number;
        firebaseUid = decoded.uid;
      } catch (verifyErr) {
        console.error('Firebase Token Verification Failed:', verifyErr.message);
        return errorResponse(res, 'अवैध किंवा कालबाह्य Firebase टोकन. कृपया पुन्हा OTP पडताळणी करा.', 401);
      }
    } else {
      // If Firebase Admin credentials are not yet configured on server
      if (idToken) {
        // Token received but server lacks Admin credentials
        return errorResponse(res, 'सर्व्हरवर Firebase Admin क्रेडेंशियल्स कॉन्फिगर केलेली नाहीत. कृपया Render सेटिंग्ज तपासा किंवा पासवर्ड/पिन ने लॉगिन करा.', 503);
      }
      return errorResponse(res, 'Firebase SMS OTP पडताळणीसाठी Firebase क्रेडेंशियल्स आवश्यक आहेत. कृपया पासवर्ड/पिन ने लॉगिन करा.', 400);
    }

    if (!verifiedPhone) {
      return errorResponse(res, 'प्रमाणित मोबाइल नंबर प्राप्त झाला नाही.', 400);
    }

    const cleanPhone = verifiedPhone.replace(/[^0-9]/g, '');
    const last10 = cleanPhone.slice(-10);

    let user = null;
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: verifiedPhone },
          { phone: { contains: last10 } },
          ...(firebaseUid ? [{ firebaseUid }] : []),
        ],
      },
      include: {
        user: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
      },
    });

    if (customer?.user) {
      user = customer.user;
    } else {
      // Check if it's the Owner
      if (role === 'OWNER' || role === 'ADMIN') {
        const ownerUser = await prisma.user.findFirst({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        });
        const settings = await prisma.businessSettings.findFirst();
        const allowedOwnerPhones = [
          process.env.OWNER_PHONE,
          settings?.phone,
          '9822334455',
        ].filter(Boolean).map((p) => p.replace(/[^0-9]/g, '').slice(-10));

        if (allowedOwnerPhones.some((p) => last10 === p)) {
          user = ownerUser;
        } else if (customer?.user && ['SUPER_ADMIN', 'ADMIN'].includes(customer.user.role)) {
          user = customer.user;
        }
      }
    }

    if (!user) {
      if (role === 'OWNER' || role === 'ADMIN') {
        return errorResponse(res, 'या मोबाइल नंबरवर कोणताही मालक खाते अस्तित्वात नाही.', 404);
      }
      return res.status(404).json({
        success: false,
        code: 'REGISTRATION_REQUIRED',
        message: 'या मोबाइल नंबरवर खाते आढळले नाही. कृपया प्रथम नोंदणी करा.',
        verifiedPhone,
        firebaseUid,
      });
    }

    // Role check: enforce Owner permissions
    if ((role === 'OWNER' || role === 'ADMIN') && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return errorResponse(res, 'या खात्याला मालक/व्यवस्थापक डॅशबोर्डचा अधिकार नाही.', 403);
    }

    // Customer status checks
    if (user.role === 'CUSTOMER' && customer) {
      if (customer.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          success: false,
          code: 'PENDING_APPROVAL',
          message: 'आपली नोंदणी यशस्वीरीत्या प्राप्त झाली आहे. मेस मालकाच्या मंजुरीनंतर आपले खाते सुरू केले जाईल.',
          customer: {
            name: customer.name,
            phone: customer.phone,
            status: customer.status,
          },
        });
      }
      if (customer.status === 'REJECTED') {
        return errorResponse(res, 'आपली नोंदणी नाकारण्यात आली आहे. कृपया मेस व्यवस्थापनाशी संपर्क साधा.', 403);
      }
      if (customer.status === 'SUSPENDED' || customer.status === 'INACTIVE') {
        return errorResponse(res, 'आपले खाते स्थगित करण्यात आले आहे. कृपया मेस व्यवस्थापनाशी संपर्क साधा.', 403);
      }
    }

    // Link firebase details if not linked yet
    if (customer && (!customer.firebaseUid || !customer.phoneVerified)) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firebaseUid: firebaseUid || customer.firebaseUid,
          phoneVerified: true,
        },
      });
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

    await logAudit(user.id, 'FIREBASE_PHONE_LOGIN', 'User', user.id, { role: user.role, phone: verifiedPhone }, req);

    return successResponse(res, 'Firebase मोबाइल लॉगिन यशस्वी!', {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customer,
      },
    });
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

    return successResponse(res, 'Password reset instructions have been generated.');
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
