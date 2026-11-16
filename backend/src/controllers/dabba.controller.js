import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';

// Get daily dabba list for owner
export const getDailyDabbaList = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { date = todayStr, mealType = 'LUNCH' } = req.query;

    // Fetch approved customers
    const customers = await prisma.customer.findMany({
      where: {
        status: { in: ['ACTIVE', 'APPROVED'] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        customerCode: true,
        address: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: { plan: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch existing dabba records for this date & meal
    const dabbas = await prisma.dailyDabba.findMany({
      where: {
        date,
        mealType,
      },
    });

    const dabbaMap = new Map();
    dabbas.forEach((d) => dabbaMap.set(d.customerId, d));

    const combinedList = customers.map((cust) => {
      const dabba = dabbaMap.get(cust.id);
      return {
        customer: cust,
        dabba: dabba || {
          status: 'NOT_RECORDED',
          givenAt: null,
          returnedAt: null,
          remarks: null,
        },
      };
    });

    const toBeGiven = combinedList.filter((i) => !i.dabba.status || i.dabba.status === 'NOT_RECORDED' || i.dabba.status === 'PREPARED');
    const given = combinedList.filter((i) => i.dabba.status === 'GIVEN');
    const returned = combinedList.filter((i) => i.dabba.status === 'RETURNED');
    const notReturned = combinedList.filter((i) => i.dabba.status === 'GIVEN');

    return successResponse(res, 'Daily dabba records fetched', {
      date,
      mealType,
      summary: {
        totalApprovedCustomers: customers.length,
        toBeGivenCount: toBeGiven.length,
        givenCount: given.length,
        returnedCount: returned.length,
        notReturnedCount: notReturned.length,
      },
      lists: {
        toBeGiven,
        given,
        returned,
        notReturned,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark Dabba Given / Collected -> Automatically Records Attendance
export const markDabbaGiven = async (req, res, next) => {
  try {
    const { customerId, date, mealType = 'LUNCH', remarks } = req.body;
    if (!customerId || !date || !mealType) {
      return errorResponse(res, 'Customer ID, date, and mealType are required.', 400);
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return errorResponse(res, 'Customer not found.', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update DailyDabba record
      const dabba = await tx.dailyDabba.upsert({
        where: {
          unique_customer_meal_date_dabba: {
            customerId,
            mealType,
            date,
          },
        },
        create: {
          customerId,
          date,
          mealType,
          status: 'GIVEN',
          givenAt: new Date(),
          recordedById: req.user.id,
          remarks: remarks || 'डबा दिला (Dabba Given)',
        },
        update: {
          status: 'GIVEN',
          givenAt: new Date(),
          recordedById: req.user.id,
          remarks: remarks ? `${remarks}` : 'डबा दिला (Dabba Given)',
        },
      });

      // 2. Attendance Rule: Attendance is recorded ONLY when customer actually collects dabba!
      // Check if attendance already recorded
      const existingAttendance = await tx.attendance.findUnique({
        where: {
          unique_customer_meal_date: {
            customerId,
            mealType,
            date,
          },
        },
      });

      let attendance = existingAttendance;
      if (!existingAttendance) {
        attendance = await tx.attendance.create({
          data: {
            customerId,
            mealType,
            date,
            scanTime: new Date(),
            method: 'MANUAL_ADMIN',
            scannedById: null,
            isVerified: true,
            notes: remarks ? `डबा स्वीकारला: ${remarks}` : 'डबा स्वीकारल्यामुळे हजेरी नोंदवली',
          },
        });
      }

      return { dabba, attendance };
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'DABBA_GIVEN_ATTENDANCE_RECORDED', 'DailyDabba', result.dabba.id, {
      customerId,
      date,
      mealType,
      attendanceId: result.attendance?.id,
    }, req);

    return successResponse(res, 'डबा दिला व ग्राहकाची हजेरी नोंदवली गेली. (Dabba Given & Attendance Marked)', result);
  } catch (error) {
    next(error);
  }
};

// Mark Dabba Returned (Does NOT create attendance)
export const markDabbaReturned = async (req, res, next) => {
  try {
    const { customerId, date, mealType = 'LUNCH', remarks } = req.body;
    if (!customerId || !date || !mealType) {
      return errorResponse(res, 'Customer ID, date, and mealType are required.', 400);
    }

    const dabba = await prisma.dailyDabba.upsert({
      where: {
        unique_customer_meal_date_dabba: {
          customerId,
          mealType,
          date,
        },
      },
      create: {
        customerId,
        date,
        mealType,
        status: 'RETURNED',
        givenAt: new Date(),
        returnedAt: new Date(),
        recordedById: req.user.id,
        remarks: remarks || 'रिकामी डबा जमा झाला (Dabba Returned)',
      },
      update: {
        status: 'RETURNED',
        returnedAt: new Date(),
        remarks: remarks ? `${remarks}` : 'रिकामी डबा जमा झाला (Dabba Returned)',
      },
    });

    await logAudit(req.user.id, 'DABBA_RETURNED', 'DailyDabba', dabba.id, {
      customerId,
      date,
      mealType,
    }, req);

    return successResponse(res, 'डबा परत जमा झाला. (Dabba Returned Successfully - No Attendance added)', { dabba });
  } catch (error) {
    next(error);
  }
};

// Mark Dabba Prepared
export const markDabbaPrepared = async (req, res, next) => {
  try {
    const { customerId, date, mealType = 'LUNCH', remarks } = req.body;
    if (!customerId || !date || !mealType) {
      return errorResponse(res, 'Customer ID, date, and mealType are required.', 400);
    }

    const dabba = await prisma.dailyDabba.upsert({
      where: {
        unique_customer_meal_date_dabba: {
          customerId,
          mealType,
          date,
        },
      },
      create: {
        customerId,
        date,
        mealType,
        status: 'PREPARED',
        recordedById: req.user.id,
        remarks: remarks || 'डबा तयार आहे (Prepared)',
      },
      update: {
        status: 'PREPARED',
        remarks: remarks || 'डबा तयार आहे (Prepared)',
      },
    });

    return successResponse(res, 'डबा तयार म्हणून नोंदवला. (Dabba Prepared)', { dabba });
  } catch (error) {
    next(error);
  }
};

// Batch prepare dabbas for active customers
export const batchPrepareDabbas = async (req, res, next) => {
  try {
    const { date, mealType = 'LUNCH' } = req.body;
    if (!date) {
      return errorResponse(res, 'Date is required.', 400);
    }

    const customers = await prisma.customer.findMany({
      where: { status: { in: ['ACTIVE', 'APPROVED'] } },
      select: { id: true },
    });

    let count = 0;
    for (const c of customers) {
      await prisma.dailyDabba.upsert({
        where: {
          unique_customer_meal_date_dabba: {
            customerId: c.id,
            mealType,
            date,
          },
        },
        create: {
          customerId: c.id,
          date,
          mealType,
          status: 'PREPARED',
          recordedById: req.user.id,
          remarks: 'दैनिक डबा तयार केला (Batch Prepared)',
        },
        update: {}, // keep existing status if already marked
      });
      count++;
    }

    return successResponse(res, `${count} ग्राहकांसाठी डबा तयार करण्यात आला.`, { preparedCount: count });
  } catch (error) {
    next(error);
  }
};

// Authorized correction with mandatory reason
export const correctDabbaRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason, removeAttendance = false } = req.body;

    if (!status || !reason) {
      return errorResponse(res, 'New status and reason for correction are required.', 400);
    }

    const existing = await prisma.dailyDabba.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existing) {
      return errorResponse(res, 'Dabba record not found.', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.dailyDabba.update({
        where: { id },
        data: {
          status,
          correctionReason: `${new Date().toLocaleDateString()}: ${reason} (by ${req.user.email})`,
        },
      });

      if (removeAttendance && existing.status === 'GIVEN' && status !== 'GIVEN') {
        await tx.attendance.deleteMany({
          where: {
            customerId: existing.customerId,
            mealType: existing.mealType,
            date: existing.date,
          },
        });
      }

      return updated;
    });

    await logAudit(req.user.id, 'DABBA_CORRECTION', 'DailyDabba', id, {
      oldStatus: existing.status,
      newStatus: status,
      reason,
      removeAttendance,
    }, req);

    return successResponse(res, 'डबा नोंदीमध्ये सुधारणा केली. (Correction Applied)', { dabba: result });
  } catch (error) {
    next(error);
  }
};

// Customer view their own daily dabba history
export const getMyDabbaHistory = async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    if (!customerId) {
      return errorResponse(res, 'Customer profile not found.', 403);
    }

    const { limit = 30 } = req.query;

    const dabbas = await prisma.dailyDabba.findMany({
      where: { customerId },
      orderBy: { date: 'desc' },
      take: Number(limit),
    });

    return successResponse(res, 'Customer dabba history fetched', { dabbas });
  } catch (error) {
    next(error);
  }
};
