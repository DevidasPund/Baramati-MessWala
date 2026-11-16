import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { whatsappService } from '../integrations/whatsapp.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { customerCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return successResponse(res, 'Customers fetched', {
      customers,
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

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true, lastLogin: true } },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        attendance: {
          take: 30,
          orderBy: { scanTime: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        extraMeals: {
          orderBy: { createdAt: 'desc' },
        },
        complaints: {
          orderBy: { createdAt: 'desc' },
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found.', 404);
    }

    return successResponse(res, 'Customer details fetched', { customer });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, emergencyContact, status = 'ACTIVE', planId, initialPaymentMethod, notes } = req.body;

    if (!name || !phone) {
      return errorResponse(res, 'Customer name and phone number are required.', 400);
    }

    const cleanPhone = phone.trim();
    const cleanEmail = (email || `${cleanPhone}@baramatimesswala.com`).toLowerCase().trim();

    // Prevent duplicate phone
    const existingPhone = await prisma.customer.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) {
      return errorResponse(res, 'A customer with this phone number already exists.', 409);
    }

    // Default password for customer
    const rawPassword = 'Pass@' + cleanPhone.slice(-4);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const count = await prisma.customer.count();
    const customerCode = `BMW-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const qrToken = 'bmw_qr_' + crypto.randomBytes(16).toString('hex');

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
          status,
          qrToken,
          notes,
        },
      });

      let subscription = null;
      let invoice = null;

      if (planId) {
        const plan = await tx.subscriptionPlan.findUnique({ where: { id: planId } });
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.durationDays);

          subscription = await tx.subscription.create({
            data: {
              customerId: customer.id,
              planId: plan.id,
              startDate,
              endDate,
              amount: plan.price,
              status: 'ACTIVE',
            },
          });

          // Create first invoice
          const invMonth = startDate.getMonth() + 1;
          const invYear = startDate.getFullYear();
          invoice = await tx.invoice.create({
            data: {
              invoiceNumber: `INV-${invYear}-${customer.customerCode.replace('BMW-', '')}`,
              customerId: customer.id,
              subscriptionId: subscription.id,
              billingMonth: invMonth,
              billingYear: invYear,
              periodStart: startDate,
              periodEnd: endDate,
              subscriptionAmount: plan.price,
              totalAmount: plan.price,
              paidAmount: initialPaymentMethod ? plan.price : 0.00,
              balanceDue: initialPaymentMethod ? 0.00 : plan.price,
              status: initialPaymentMethod ? 'PAID' : 'PENDING',
              dueDate: new Date(startDate.getTime() + 5 * 24 * 3600 * 1000),
              items: {
                create: [
                  {
                    description: `${plan.name} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
                    itemType: 'SUBSCRIPTION',
                    quantity: 1,
                    unitPrice: plan.price,
                    amount: plan.price,
                    date: startDate,
                  },
                ],
              },
            },
          });

          if (initialPaymentMethod) {
            await tx.payment.create({
              data: {
                paymentNumber: `PAY-${invYear}-${customer.customerCode.replace('BMW-', '')}`,
                invoiceId: invoice.id,
                customerId: customer.id,
                amount: plan.price,
                paymentMethod: initialPaymentMethod,
                status: 'VERIFIED',
                verifiedById: req.user.id,
                verifiedAt: new Date(),
                notes: 'Initial joining payment recorded by admin',
              },
            });
          }
        }
      }

      return { user, customer, subscription, invoice, tempPassword: rawPassword };
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'CREATE_CUSTOMER', 'Customer', result.customer.id, { customerCode }, req);

    whatsappService.sendNotification({
      customerId: result.customer.id,
      phone: result.customer.phone,
      templateType: 'WELCOME',
      data: {
        customerName: result.customer.name,
        customerCode: result.customer.customerCode,
      },
    }).catch((err) => console.error('Notification error:', err));

    return successResponse(res, 'Customer created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, emergencyContact, status, notes } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Customer not found', 404);
    }

    if (phone && phone !== existing.phone) {
      const duplicate = await prisma.customer.findUnique({ where: { phone } });
      if (duplicate && duplicate.id !== id) {
        return errorResponse(res, 'Another customer with this phone number already exists.', 409);
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(address && { address }),
        ...(emergencyContact && { emergencyContact }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logAudit(req.user.id, 'UPDATE_CUSTOMER', 'Customer', id, req.body, req);

    return successResponse(res, 'Customer updated successfully', { customer: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    // Deleting the User cascades delete to Customer and related records
    await prisma.user.delete({ where: { id: customer.userId } });

    await logAudit(req.user.id, 'DELETE_CUSTOMER', 'Customer', id, { customerCode: customer.customerCode }, req);

    return successResponse(res, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const regenerateQrToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newQrToken = 'bmw_qr_' + crypto.randomBytes(16).toString('hex');

    const customer = await prisma.customer.update({
      where: { id },
      data: { qrToken: newQrToken },
    });

    await logAudit(req.user.id, 'REGENERATE_QR', 'Customer', id, null, req);

    return successResponse(res, 'QR Token regenerated successfully', { qrToken: customer.qrToken });
  } catch (error) {
    next(error);
  }
};

export const getMyDashboardStats = async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    if (!customerId) {
      return errorResponse(res, 'Customer profile not found for this account.', 403);
    }

    const { month, year } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || (now.getMonth() + 1);

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

    const todayStr = new Date().toISOString().split('T')[0];

    const [customer, totalMealsCount, monthlyAttendance, allInvoices, payments, extraMeals, todayMenu, todayDabbas, recentDabbas] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.attendance.count({
        where: { customerId },
      }),
      prisma.attendance.findMany({
        where: {
          customerId,
          date: { gte: startOfMonthStr, lte: endOfMonthStr },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.invoice.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.payment.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.extraMeal.findMany({
        where: {
          customerId,
          date: { gte: startOfMonthStr, lte: endOfMonthStr },
        },
      }),
      prisma.foodMenu.findMany({
        where: { date: todayStr },
      }),
      prisma.dailyDabba.findMany({
        where: { customerId, date: todayStr },
      }),
      prisma.dailyDabba.findMany({
        where: { customerId },
        orderBy: { date: 'desc' },
        take: 15,
      }),
    ]);

    const totalBalanceDue = allInvoices.reduce((acc, inv) => acc + (inv.status !== 'PAID' ? Number(inv.balanceDue || 0) : 0), 0);
    const currentSub = customer?.subscriptions?.[0];
    const basePlanPrice = currentSub?.plan ? Number(currentSub.plan.price) : 0;
    const extraMealsCost = extraMeals.reduce((acc, em) => acc + Number(em.totalAmount || 0), 0);
    const monthlyTotalExpense = basePlanPrice + extraMealsCost;

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const dailyRecords = [];
    const mealPricePerMeal = currentSub?.plan?.price ? Math.round(Number(currentSub.plan.price) / (daysInMonth * (currentSub.plan.mealsPerDay || 2))) : 70;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAttendances = monthlyAttendance.filter((a) => a.date === dayStr);
      const hasBreakfast = dayAttendances.some((a) => a.mealType === 'BREAKFAST');
      const hasLunch = dayAttendances.some((a) => a.mealType === 'LUNCH');
      const hasDinner = dayAttendances.some((a) => a.mealType === 'DINNER');
      const attendedCount = (hasBreakfast ? 1 : 0) + (hasLunch ? 1 : 0) + (hasDinner ? 1 : 0);
      const dayAmount = attendedCount * mealPricePerMeal;

      if (new Date(dayStr) <= new Date() || dayAttendances.length > 0) {
        dailyRecords.push({
          date: dayStr,
          breakfast: hasBreakfast,
          lunch: hasLunch,
          dinner: hasDinner,
          rate: mealPricePerMeal,
          amount: dayAmount,
          attendedCount,
        });
      }
    }

    return successResponse(res, 'Customer dashboard stats fetched', {
      customer,
      kpis: {
        totalMealsAttended: totalMealsCount,
        currentMonthMealsAttended: monthlyAttendance.length,
        outstandingBalance: totalBalanceDue,
        monthlyTotalExpense,
      },
      dailyRecords,
      payments,
      invoices: allInvoices,
      activeSubscription: currentSub || null,
      todayMenu,
      todayDabbas,
      recentDabbas,
    });
  } catch (error) {
    next(error);
  }
};

// Owner Customer Verification Action: Approve, Reject, Suspend, Reactivate
export const verifyCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status, action, reason } = req.body;

    if (!status && action) {
      if (action === 'APPROVE') status = 'APPROVED';
      else if (action === 'REJECT') status = 'REJECTED';
      else if (action === 'SUSPEND') status = 'SUSPENDED';
      else if (action === 'REACTIVATE') status = 'APPROVED';
    }

    const validStatuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ACTIVE'];
    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Allowed: ${validStatuses.join(', ')}`, 400);
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found.', 404);
    }

    const isApproved = status === 'APPROVED' || status === 'ACTIVE';
    const isDeactivated = status === 'REJECTED' || status === 'SUSPENDED';

    const result = await prisma.$transaction(async (tx) => {
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          status,
          ...(isApproved && {
            approvedById: req.user.id,
            approvedAt: new Date(),
            rejectionReason: null,
          }),
          ...(isDeactivated && {
            rejectionReason: reason || `Action marked as ${status} by owner`,
          }),
        },
      });

      if (customer.user) {
        await tx.user.update({
          where: { id: customer.user.id },
          data: {
            isActive: !isDeactivated,
          },
        });
      }

      return updatedCustomer;
    });

    await logAudit(req.user.id, `CUSTOMER_${status}`, 'Customer', id, {
      status,
      reason,
      approvedById: isApproved ? req.user.id : null,
    }, req);

    return successResponse(res, `ग्राहकाची स्थिती ${status} म्हणून नोंदवली गेली.`, { customer: result });
  } catch (error) {
    next(error);
  }
};

// Owner Manual Verify Phone Number
export const manualVerifyPhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id },
      data: { phoneVerified: true },
    });

    await logAudit(req.user.id, 'MANUAL_PHONE_VERIFIED', 'Customer', id, null, req);
    return successResponse(res, 'ग्राहकाचा मोबाइल नंबर प्रमाणित करण्यात आला.', { customer });
  } catch (error) {
    next(error);
  }
};

// Owner Reset Customer Password / PIN
export const ownerResetCustomerPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return errorResponse(res, 'नवीन पासवर्ड किंवा पिन किमान ४ अक्षरांचा असणे आवश्यक आहे.', 400);
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!customer || !customer.user) {
      return errorResponse(res, 'Customer or associated user account not found.', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: customer.user.id },
      data: { passwordHash },
    });

    await logAudit(req.user.id, 'OWNER_RESET_CUSTOMER_PASSWORD', 'Customer', id, null, req);

    return successResponse(res, 'ग्राहकाचा पासवर्ड यशस्वीरीत्या बदलण्यात आला.');
  } catch (error) {
    next(error);
  }
};
