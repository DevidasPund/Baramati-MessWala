import crypto from 'crypto';
import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { generateExcelBuffer } from '../utils/excelExport.js';

// Helper: Determine current active meal based on time and settings
export const getCurrentMealType = async () => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
  const now = new Date();
  const currentHoursMinutes = now.toTimeString().slice(0, 5); // "HH:MM"

  if (settings) {
    if (currentHoursMinutes >= settings.breakfastStartTime && currentHoursMinutes <= settings.breakfastEndTime) {
      return 'BREAKFAST';
    }
    if (currentHoursMinutes >= settings.lunchStartTime && currentHoursMinutes <= settings.lunchEndTime) {
      return 'LUNCH';
    }
    if (currentHoursMinutes >= settings.dinnerStartTime && currentHoursMinutes <= settings.dinnerEndTime) {
      return 'DINNER';
    }
  }

  // Fallback defaults
  const hour = now.getHours();
  if (hour >= 6 && hour < 11) return 'BREAKFAST';
  if (hour >= 11 && hour < 16) return 'LUNCH';
  return 'DINNER';
};

// Generate Dynamic Mess QR Session (Method A)
export const getActiveMessQrSession = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const mealType = req.query.mealType || (await getCurrentMealType());

    // Clean up expired sessions
    await prisma.messQrSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // Check existing valid session for this meal & date
    let session = await prisma.messQrSession.findFirst({
      where: {
        date: todayStr,
        mealType: mealType,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      const token = 'bmw_sess_' + crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes session

      session = await prisma.messQrSession.create({
        data: {
          token,
          mealType,
          date: todayStr,
          expiresAt,
        },
      });
    }

    return successResponse(res, 'Mess QR Session generated', {
      sessionToken: session.token,
      mealType: session.mealType,
      date: session.date,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// Validation & recording engine for both scanning methods
export const processAttendanceRecord = async ({
  customer,
  mealType,
  dateStr,
  method,
  staffId = null,
}) => {
  // 1. Verify customer status
  if (customer.status !== 'ACTIVE') {
    return {
      allowed: false,
      reason: `Customer account is currently ${customer.status}. Attendance not allowed.`,
    };
  }

  // 2. Verify active subscription
  // Normalize boundary timestamps based on dateStr to eliminate timezone skew
  const [dYear, dMonth, dDay] = (dateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
  const startOfDay = new Date(Date.UTC(dYear, dMonth - 1, dDay, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(dYear, dMonth - 1, dDay, 23, 59, 59, 999));

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      customerId: customer.id,
      status: 'ACTIVE',
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeSubscription) {
    return {
      allowed: false,
      reason: 'No active subscription found for today. Please renew your plan.',
    };
  }

  // 3. Verify meal is included in the subscription plan
  if (!activeSubscription.plan.includedMeals.includes(mealType)) {
    return {
      allowed: false,
      reason: `Your plan (${activeSubscription.plan.name}) does not include ${mealType}.`,
    };
  }

  // 4. Verify customer has not requested a meal skip for this meal & date
  const skipRequest = await prisma.mealRequest.findFirst({
    where: {
      customerId: customer.id,
      requestType: 'MEAL_SKIP',
      status: 'APPROVED',
      mealType: mealType,
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
  });

  if (skipRequest) {
    return {
      allowed: false,
      reason: `Customer has an approved meal skip for ${mealType} on ${dateStr}.`,
    };
  }

  // 5. Verify no duplicate attendance
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      unique_customer_meal_date: {
        customerId: customer.id,
        mealType: mealType,
        date: dateStr,
      },
    },
  });

  if (existingAttendance) {
    return {
      allowed: false,
      reason: `Attendance already marked for ${mealType} today at ${new Date(existingAttendance.scanTime).toLocaleTimeString()}.`,
    };
  }

  // 6. Record attendance
  const attendance = await prisma.attendance.create({
    data: {
      customerId: customer.id,
      mealType,
      date: dateStr,
      scanTime: new Date(),
      method,
      scannedById: staffId,
      isVerified: true,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          phone: true,
        },
      },
    },
  });

  return {
    allowed: true,
    attendance,
    planName: activeSubscription.plan.name,
  };
};

// METHOD A: Customer Scans Mess QR
export const scanMessQrByCustomer = async (req, res, next) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) {
      return errorResponse(res, 'Session token is required', 400);
    }

    const customer = req.user.customer;
    if (!customer) {
      return errorResponse(res, 'Only customers can use this attendance scan method.', 403);
    }

    // Verify session token
    const session = await prisma.messQrSession.findUnique({ where: { token: sessionToken } });
    if (!session || session.expiresAt < new Date()) {
      return errorResponse(res, 'The Mess QR code has expired or is invalid. Please scan the live QR on display.', 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const result = await processAttendanceRecord({
      customer,
      mealType: session.mealType,
      dateStr: todayStr,
      method: 'CUSTOMER_SCANS_MESS',
    });

    if (!result.allowed) {
      return errorResponse(res, result.reason, 400);
    }

    await logAudit(req.user.id, 'SCAN_ATTENDANCE_METHOD_A', 'Attendance', result.attendance.id, { mealType: session.mealType }, req);

    return successResponse(res, `Attendance marked successfully for ${session.mealType}! Enjoy your meal.`, {
      attendance: result.attendance,
      plan: result.planName,
    });
  } catch (error) {
    next(error);
  }
};

// METHOD B: Staff Scans Customer QR
export const scanCustomerQrByStaff = async (req, res, next) => {
  try {
    const { qrToken, mealType } = req.body;
    if (!qrToken) {
      return errorResponse(res, 'Customer QR token is required', 400);
    }

    const effectiveMealType = mealType || (await getCurrentMealType());
    const customer = await prisma.customer.findUnique({
      where: { qrToken },
    });

    if (!customer) {
      return errorResponse(res, 'Invalid QR code. Customer not found in the system.', 404);
    }

    const staffId = req.user.staff?.id || null;
    const todayStr = new Date().toISOString().split('T')[0];

    const result = await processAttendanceRecord({
      customer,
      mealType: effectiveMealType,
      dateStr: todayStr,
      method: 'STAFF_SCANS_CUSTOMER',
      staffId,
    });

    if (!result.allowed) {
      return errorResponse(res, result.reason, 400);
    }

    await logAudit(req.user.id, 'SCAN_ATTENDANCE_METHOD_B', 'Attendance', result.attendance.id, {
      customerId: customer.id,
      mealType: effectiveMealType,
      staffId,
    }, req);

    return successResponse(res, `Attendance marked for ${customer.name} (${effectiveMealType})`, {
      attendance: result.attendance,
      plan: result.planName,
      customer: {
        name: customer.name,
        code: customer.customerCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Manual Attendance Record / Correction by Admin
export const recordManualAttendance = async (req, res, next) => {
  try {
    const { customerId, mealType, date, notes } = req.body;
    if (!customerId || !mealType || !date) {
      return errorResponse(res, 'Customer, meal type, and date are required', 400);
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    // Check duplicate
    const existing = await prisma.attendance.findUnique({
      where: {
        unique_customer_meal_date: {
          customerId,
          mealType,
          date,
        },
      },
    });

    if (existing) {
      return errorResponse(res, `Attendance for ${mealType} on ${date} already exists for this customer.`, 409);
    }

    const attendance = await prisma.attendance.create({
      data: {
        customerId,
        mealType,
        date,
        method: 'MANUAL_ADMIN',
        scannedById: req.user.staff?.id || null,
        notes: notes || 'Manually entered by admin',
        isVerified: true,
      },
      include: { customer: true },
    });

    await logAudit(req.user.id, 'MANUAL_ATTENDANCE_ENTRY', 'Attendance', attendance.id, req.body, req);

    return successResponse(res, 'Attendance recorded manually', { attendance }, 201);
  } catch (error) {
    next(error);
  }
};

// Delete Attendance Record (Admin Correction with Audit Log)
export const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const record = await prisma.attendance.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!record) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    await prisma.attendance.delete({ where: { id } });

    await logAudit(req.user.id, 'DELETE_ATTENDANCE_CORRECTION', 'Attendance', id, {
      customerCode: record.customer.customerCode,
      mealType: record.mealType,
      date: record.date,
      reason: reason || 'Admin correction',
    }, req);

    return successResponse(res, 'Attendance record deleted / corrected successfully');
  } catch (error) {
    next(error);
  }
};

// Get Attendance List with Filters
export const getAttendanceList = async (req, res, next) => {
  try {
    const { date, mealType, customerId, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id || 'none';
    } else if (customerId) {
      where.customerId = customerId;
    }
    if (date) where.date = date;
    if (mealType && mealType !== 'ALL') where.mealType = mealType;

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { customerCode: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { scanTime: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              phone: true,
            },
          },
          scannedByStaff: {
            select: { name: true, staffCode: true },
          },
        },
      }),
    ]);

    return successResponse(res, 'Attendance records fetched', {
      records,
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

// Export Attendance to Excel
export const exportAttendanceExcel = async (req, res, next) => {
  try {
    const { date, mealType, customerId } = req.query;
    const where = {};
    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id || 'none';
    } else if (customerId) {
      where.customerId = customerId;
    }
    if (date) where.date = date;
    if (mealType && mealType !== 'ALL') where.mealType = mealType;

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { scanTime: 'desc' },
      include: {
        customer: true,
        scannedByStaff: true,
      },
    });

    const exportData = records.map((r, i) => ({
      'Sr No': i + 1,
      'Customer Code': r.customer?.customerCode,
      'Customer Name': r.customer?.name,
      'Phone': r.customer?.phone,
      'Meal Type': r.mealType,
      'Date': r.date,
      'Scan Time': new Date(r.scanTime).toLocaleTimeString(),
      'Method': r.method,
      'Scanned By': r.scannedByStaff ? `${r.scannedByStaff.name} (${r.scannedByStaff.staffCode})` : 'Self Scan / System',
      'Verified': r.isVerified ? 'Yes' : 'No',
    }));

    const buffer = generateExcelBuffer(exportData, 'Attendance_Report');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Baramati_Messwala_Attendance_${date || 'all'}.xlsx`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};
