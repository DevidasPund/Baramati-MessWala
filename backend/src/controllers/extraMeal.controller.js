import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { whatsappService } from '../integrations/whatsapp.js';

// Get extra meal pricing from settings
const getMealPrice = async (mealType, category) => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
  if (category === 'GUEST_MEAL') {
    return Number(settings?.guestMealPrice || 110.00);
  }
  if (mealType === 'BREAKFAST') return Number(settings?.extraBreakfastPrice || 40.00);
  if (mealType === 'LUNCH') return Number(settings?.extraLunchPrice || 90.00);
  if (mealType === 'DINNER') return Number(settings?.extraDinnerPrice || 90.00);
  return 90.00;
};

// Book Extra Meal or Guest Meal (Customer or Admin)
export const bookExtraMeal = async (req, res, next) => {
  try {
    const { customerId, mealType, date, count = 1, mealCategory = 'EXTRA_MEAL', requestReason } = req.body;

    const targetCustomerId = req.user.role === 'CUSTOMER' ? req.user.customer?.id : customerId;
    if (!targetCustomerId) {
      return errorResponse(res, 'Customer ID is required', 400);
    }

    if (!mealType || !date) {
      return errorResponse(res, 'Meal type and date are required', 400);
    }

    const numCount = Number(count) || 1;
    if (numCount < 1 || numCount > 20) {
      return errorResponse(res, 'Invalid count (1-20 allowed)', 400);
    }

    // Check duplicate extra meal booking for same customer, date, meal
    if (mealCategory === 'EXTRA_MEAL') {
      const existing = await prisma.extraMeal.findFirst({
        where: {
          customerId: targetCustomerId,
          mealType,
          date,
          mealCategory: 'EXTRA_MEAL',
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

      if (existing) {
        return errorResponse(res, `An extra ${mealType} is already booked or requested for ${date}.`, 409);
      }
    }

    const pricePerMeal = await getMealPrice(mealType, mealCategory);
    const totalAmount = pricePerMeal * numCount;

    // If booked by Admin, auto-approve; if Customer, set to PENDING
    const initialStatus = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role) ? 'APPROVED' : 'PENDING';

    const extraMeal = await prisma.extraMeal.create({
      data: {
        customerId: targetCustomerId,
        mealType,
        date,
        count: numCount,
        mealCategory,
        chargePerMeal: pricePerMeal,
        totalAmount,
        status: initialStatus,
        requestReason,
      },
      include: {
        customer: true,
      },
    });

    await logAudit(req.user.id, 'BOOK_EXTRA_MEAL', 'ExtraMeal', extraMeal.id, req.body, req);

    if (initialStatus === 'APPROVED') {
      whatsappService.sendNotification({
        customerId: extraMeal.customer.id,
        phone: extraMeal.customer.phone,
        templateType: 'EXTRA_MEAL_CONFIRMATION',
        data: {
          customerName: extraMeal.customer.name,
          count: numCount,
          mealType,
          date,
          totalAmount,
        },
      }).catch(err => console.error('Notification error:', err));
    }

    return successResponse(res, `Booking request for ${numCount}x ${mealType} submitted successfully.`, { extraMeal }, 201);
  } catch (error) {
    next(error);
  }
};

// Request Meal Skip or Pause / Resume (Customer)
export const createMealRequest = async (req, res, next) => {
  try {
    const { requestType, startDate, endDate, mealType, reason } = req.body;
    const customerId = req.user.role === 'CUSTOMER' ? req.user.customer?.id : req.body.customerId;

    if (!customerId || !requestType || !startDate) {
      return errorResponse(res, 'Request type and start date are required', 400);
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    end.setHours(23, 59, 59, 999);

    const mealReq = await prisma.mealRequest.create({
      data: {
        customerId,
        requestType,
        startDate: start,
        endDate: end,
        mealType: mealType || null,
        reason,
        status: 'PENDING',
      },
    });

    await logAudit(req.user.id, 'CREATE_MEAL_REQUEST', 'MealRequest', mealReq.id, req.body, req);

    return successResponse(res, 'Request submitted to administration for review.', { request: mealReq }, 201);
  } catch (error) {
    next(error);
  }
};

// Admin approve or reject Extra Meal
export const updateExtraMealStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return errorResponse(res, 'Invalid status value', 400);
    }

    const extraMeal = await prisma.extraMeal.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
      },
      include: { customer: true },
    });

    await logAudit(req.user.id, `EXTRA_MEAL_${status}`, 'ExtraMeal', id, { status, adminNotes }, req);

    if (status === 'APPROVED') {
      whatsappService.sendNotification({
        customerId: extraMeal.customer.id,
        phone: extraMeal.customer.phone,
        templateType: 'EXTRA_MEAL_CONFIRMATION',
        data: {
          customerName: extraMeal.customer.name,
          count: extraMeal.count,
          mealType: extraMeal.mealType,
          date: extraMeal.date,
          totalAmount: extraMeal.totalAmount,
        },
      }).catch(err => console.error('Notification error:', err));
    }

    return successResponse(res, `Extra meal request marked as ${status}.`, { extraMeal });
  } catch (error) {
    next(error);
  }
};

// Admin approve or reject Meal Request (Skip/Pause/Resume)
export const updateMealRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const mealReq = await prisma.mealRequest.update({
      where: { id },
      data: { status, adminNotes },
      include: { customer: true },
    });

    // If it was a subscription pause request and got approved, execute pause
    if (status === 'APPROVED' && mealReq.requestType === 'PAUSE_SUBSCRIPTION') {
      const activeSub = await prisma.subscription.findFirst({
        where: { customerId: mealReq.customerId, status: 'ACTIVE' },
      });
      if (activeSub) {
        await prisma.subscription.update({
          where: { id: activeSub.id },
          data: { status: 'PAUSED', pausedAt: new Date() },
        });
        await prisma.customer.update({
          where: { id: mealReq.customerId },
          data: { status: 'PAUSED' },
        });
      }
    }

    await logAudit(req.user.id, `MEAL_REQUEST_${status}`, 'MealRequest', id, { status, adminNotes }, req);

    return successResponse(res, `Request marked as ${status}`, { request: mealReq });
  } catch (error) {
    next(error);
  }
};

// List Extra Meals
export const getExtraMeals = async (req, res, next) => {
  try {
    const { customerId, status, date, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (status && status !== 'ALL') where.status = status;
    if (date) where.date = date;

    const [total, extraMeals] = await Promise.all([
      prisma.extraMeal.count({ where }),
      prisma.extraMeal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        },
      }),
    ]);

    return successResponse(res, 'Extra meals fetched', {
      extraMeals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

// List Meal Requests (Skip/Pause/Resume)
export const getMealRequests = async (req, res, next) => {
  try {
    const { customerId, status, requestType, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (status && status !== 'ALL') where.status = status;
    if (requestType && requestType !== 'ALL') where.requestType = requestType;

    const [total, requests] = await Promise.all([
      prisma.mealRequest.count({ where }),
      prisma.mealRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        },
      }),
    ]);

    return successResponse(res, 'Meal requests fetched', {
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};
