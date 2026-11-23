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
  notes = null,
}) => {
  // 1. Verify customer status & account approval
  // Expected Behavior:
  // - APPROVED + ACTIVE customer: Allow attendance (subject to subscription & meal rules)
  // - PENDING_APPROVAL: Reject attendance with "ग्राहक खाते अद्याप मंजूर झालेले नाही. उपस्थिती नोंदवता येणार नाही."
  // - SUSPENDED: Reject attendance with "ग्राहक खाते निलंबित आहे. उपस्थिती नोंदवता येणार नाही."
  // - REJECTED: Reject attendance with "ग्राहक खाते नाकारलेले आहे. उपस्थिती नोंदवता येणार नाही."
  // - INACTIVE: Reject attendance with "ग्राहक खाते निष्क्रिय आहे. उपस्थिती नोंदवता येणार नाही."
  if (customer.status === 'PENDING_APPROVAL') {
    return {
      allowed: false,
      reason: 'ग्राहक खाते अद्याप मंजूर झालेले नाही. उपस्थिती नोंदवता येणार नाही.',
    };
  }

  if (customer.status === 'SUSPENDED') {
    return {
      allowed: false,
      reason: 'ग्राहक खाते निलंबित आहे. उपस्थिती नोंदवता येणार नाही.',
    };
  }

  if (customer.status === 'REJECTED') {
    return {
      allowed: false,
      reason: 'ग्राहक खाते नाकारलेले आहे. उपस्थिती नोंदवता येणार नाही.',
    };
  }

  if (customer.user && customer.user.isActive === false) {
    return {
      allowed: false,
      reason: 'ग्राहक खाते निष्क्रिय आहे. उपस्थिती नोंदवता येणार नाही.',
    };
  }

  if (!['APPROVED', 'ACTIVE'].includes(customer.status)) {
    return {
      allowed: false,
      reason: 'ग्राहक खाते मंजूर किंवा सक्रिय नाही. उपस्थिती नोंदवता येणार नाही.',
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
      reason: 'सध्या कोणतेही सक्रिय सबस्क्रिप्शन उपलब्ध नाही. कृपया प्लॅनचे नूतनीकरण करा.',
    };
  }

  // 3. Verify meal is included in the subscription plan
  if (!activeSubscription.plan.includedMeals.includes(mealType)) {
    const mealLabel = mealType === 'LUNCH' ? 'दुपारचे जेवण' : mealType === 'DINNER' ? 'रात्रीचे जेवण' : 'नाश्ता';
    return {
      allowed: false,
      reason: `आपल्या प्लॅन (${activeSubscription.plan.name}) मध्ये ${mealLabel} समाविष्ट नाही.`,
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
    const mealLabel = mealType === 'LUNCH' ? 'दुपारच्या' : mealType === 'DINNER' ? 'रात्रीच्या' : 'नाश्त्याच्या';
    return {
      allowed: false,
      reason: `ग्राहकाने ${mealLabel} जेवणासाठी सुट्टी (Skip) नोंदवली आहे.`,
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
      reason: 'आजच्या या जेवणाची उपस्थिती आधीच नोंदवली आहे.',
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
      notes,
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
      scannedByStaff: true,
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

    let customer = req.user.customer;
    if (!customer) {
      return errorResponse(res, 'Only customers can use this attendance scan method.', 403);
    }
    if (!customer.user) {
      customer = { ...customer, user: req.user };
    }

    // Verify session token
    const session = await prisma.messQrSession.findUnique({ where: { token: sessionToken } });
    if (!session || session.expiresAt < new Date()) {
      return errorResponse(res, 'मेस QR कोड कालबाह्य किंवा अवैध आहे. कृपया स्क्रीनवरील थेट QR स्कॅन करा.', 400);
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

    return successResponse(res, 'ग्राहक खाते मंजूर आहे. उपस्थिती नोंदवली.', {
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
    if (!qrToken || typeof qrToken !== 'string' || !qrToken.trim()) {
      return errorResponse(res, 'अवैध QR कोड.', 400);
    }

    const effectiveMealType = mealType || (await getCurrentMealType());
    const customer = await prisma.customer.findUnique({
      where: { qrToken: qrToken.trim() },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!customer) {
      return errorResponse(res, 'अवैध QR कोड.', 404);
    }

    const staffId = req.user.staff?.id || null;
    const notes = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN'
      ? `Scanned by Owner/Admin (${req.user.email})`
      : req.user.staff
      ? `Scanned by Staff: ${req.user.staff.name} (${req.user.staff.staffCode})`
      : 'Scanned via Scanner';

    const todayStr = new Date().toISOString().split('T')[0];

    const result = await processAttendanceRecord({
      customer,
      mealType: effectiveMealType,
      dateStr: todayStr,
      method: 'STAFF_SCANS_CUSTOMER',
      staffId,
      notes,
    });

    if (!result.allowed) {
      return errorResponse(res, result.reason, 400);
    }

    await logAudit(req.user.id, 'SCAN_ATTENDANCE_METHOD_B', 'Attendance', result.attendance.id, {
      customerId: customer.id,
      mealType: effectiveMealType,
      staffId,
      scannedByRole: req.user.role,
    }, req);

    return successResponse(res, 'ग्राहक खाते मंजूर आहे. उपस्थिती नोंदवली.', {
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
