import { verifyToken } from '../utils/tokens.js';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.split(' ')[1]
      : req.query.token;

    if (!token) {
      return errorResponse(res, 'Authentication required. No token provided.', 401);
    }
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return errorResponse(res, 'Invalid or expired authentication token.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customer: true,
        staff: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'User account is inactive or not found.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized. Please login.', 401);
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, `Forbidden. Role '${req.user.role}' lacks permission for this action.`, 403);
    }

    next();
  };
};

// Customer Ownership Verification: prevents ID tampering in URL
export const verifyCustomerOwnership = (req, res, next) => {
  if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return next(); // Admins can manage any customer
  }

  if (req.user.role === 'STAFF') {
    // Staff can view customer profiles for verification / scan, but cannot modify sensitive fields
    return next();
  }

  if (req.user.role === 'CUSTOMER') {
    const targetCustomerId = req.params.customerId || req.params.id || req.query.customerId || req.body.customerId;
    if (targetCustomerId && req.user.customer?.id !== targetCustomerId) {
      return errorResponse(res, 'Access denied. You can only access your own customer records.', 403);
    }
    // Always attach customer object to request
    req.customer = req.user.customer;
    return next();
  }

  return errorResponse(res, 'Unauthorized access.', 403);
};
