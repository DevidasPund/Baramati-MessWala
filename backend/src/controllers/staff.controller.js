import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getStaffMembers = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true, lastLogin: true } },
      },
    });
    return successResponse(res, 'Staff members fetched', { staff });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req, res, next) => {
  try {
    const { name, phone, email, password, designation, permissions, role = 'STAFF' } = req.body;

    if (!name || !phone || !email || !password) {
      return errorResponse(res, 'Name, phone, email, and password are required', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return errorResponse(res, 'A user with this email already exists', 409);
    }

    const existingPhone = await prisma.staff.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) {
      return errorResponse(res, 'A staff member with this phone number already exists', 409);
    }

    const count = await prisma.staff.count();
    const staffCode = `STAFF-${String(count + 1).padStart(3, '0')}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
          isActive: true,
        },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          staffCode,
          name,
          phone: cleanPhone,
          email: cleanEmail,
          designation: designation || 'Staff Member',
          role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
          permissions: permissions || ['scan_attendance', 'view_menu', 'customer_search'],
        },
      });

      return { user, staff };
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'CREATE_STAFF', 'Staff', result.staff.id, { staffCode }, req);

    return successResponse(res, 'Staff member added successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, designation, permissions, isActive } = req.body;

    const existing = await prisma.staff.findUnique({ where: { id }, include: { user: true } });
    if (!existing) {
      return errorResponse(res, 'Staff member not found', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedStaff = await tx.staff.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(designation && { designation }),
          ...(permissions && { permissions }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      if (isActive !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive },
        });
      }

      return updatedStaff;
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'UPDATE_STAFF', 'Staff', id, req.body, req);

    return successResponse(res, 'Staff updated successfully', { staff: result });
  } catch (error) {
    next(error);
  }
};

// Staff Dashboard Metrics (Restricted view for Staff)
export const getStaffDashboard = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [todayTotal, breakfast, lunch, dinner, totalActiveCustomers] = await Promise.all([
      prisma.attendance.count({ where: { date: todayStr } }),
      prisma.attendance.count({ where: { date: todayStr, mealType: 'BREAKFAST' } }),
      prisma.attendance.count({ where: { date: todayStr, mealType: 'LUNCH' } }),
      prisma.attendance.count({ where: { date: todayStr, mealType: 'DINNER' } }),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
    ]);

    const recentScans = await prisma.attendance.findMany({
      where: { date: todayStr },
      take: 10,
      orderBy: { scanTime: 'desc' },
      include: {
        customer: { select: { name: true, customerCode: true } },
      },
    });

    return successResponse(res, 'Staff dashboard stats', {
      todayAttendance: {
        total: todayTotal,
        breakfast,
        lunch,
        dinner,
      },
      totalActiveCustomers,
      recentScans,
    });
  } catch (error) {
    next(error);
  }
};
