import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { whatsappService } from '../integrations/whatsapp.js';

// --- PLAN CONTROLLERS ---
export const getPlans = async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
    return successResponse(res, 'Subscription plans fetched', { plans });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    const { name, code, planType, durationDays, price, includedMeals, description } = req.body;

    if (!name || !code || !price || !includedMeals || !includedMeals.length) {
      return errorResponse(res, 'Name, unique code, price, and included meals are required.', 400);
    }

    const existingCode = await prisma.subscriptionPlan.findUnique({ where: { code } });
    if (existingCode) {
      return errorResponse(res, 'A plan with this code already exists.', 409);
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        code,
        planType: planType || 'MONTHLY',
        durationDays: Number(durationDays) || 30,
        price: Number(price),
        includedMeals,
        description,
      },
    });

    await logAudit(req.user.id, 'CREATE_PLAN', 'SubscriptionPlan', plan.id, req.body, req);

    return successResponse(res, 'Subscription plan created', { plan }, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, includedMeals, description, isActive, durationDays } = req.body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: Number(price) }),
        ...(includedMeals && { includedMeals }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(durationDays && { durationDays: Number(durationDays) }),
      },
    });

    await logAudit(req.user.id, 'UPDATE_PLAN', 'SubscriptionPlan', id, req.body, req);

    return successResponse(res, 'Subscription plan updated', { plan });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const activeSubCount = await prisma.subscription.count({
      where: { planId: id },
    });

    if (activeSubCount > 0) {
      return errorResponse(res, `Cannot delete plan: ${activeSubCount} subscriptions are associated with this plan. You can deactivate it instead.`, 400);
    }

    await prisma.subscriptionPlan.delete({ where: { id } });
    await logAudit(req.user.id, 'DELETE_PLAN', 'SubscriptionPlan', id, null, req);

    return successResponse(res, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

// --- SUBSCRIPTION OPERATIONS ---

export const getSubscriptions = async (req, res, next) => {
  try {
    const { status, customerId, expiringSoon, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (customerId) where.customerId = customerId;

    if (expiringSoon === 'true') {
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      where.status = 'ACTIVE';
      where.endDate = { gte: now, lte: in7Days };
    }

    const [total, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
          plan: true,
        },
      }),
    ]);

    return successResponse(res, 'Subscriptions fetched', {
      subscriptions,
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

export const assignSubscription = async (req, res, next) => {
  try {
    const { customerId, planId, startDate, discount = 0, initialPaymentMethod } = req.body;

    if (!customerId || !planId) {
      return errorResponse(res, 'Customer and Plan are required.', 400);
    }

    const [customer, plan] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
    ]);

    if (!customer || !plan) {
      return errorResponse(res, 'Customer or Plan not found', 404);
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);

    const netAmount = Math.max(0, Number(plan.price) - Number(discount));

    const result = await prisma.$transaction(async (tx) => {
      // Deactivate previous active subscription if any
      await tx.subscription.updateMany({
        where: { customerId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      const subscription = await tx.subscription.create({
        data: {
          customerId,
          planId,
          startDate: start,
          endDate: end,
          amount: netAmount,
          discount: Number(discount),
          paidAmount: initialPaymentMethod ? netAmount : 0.00,
          status: 'ACTIVE',
        },
        include: { plan: true },
      });

      // Update customer status to ACTIVE
      await tx.customer.update({
        where: { id: customerId },
        data: { status: 'ACTIVE' },
      });

      // Create Invoice
      const invMonth = start.getMonth() + 1;
      const invYear = start.getFullYear();
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${invYear}-${customer.customerCode.replace('BMW-', '')}-${Date.now().toString().slice(-4)}`,
          customerId,
          subscriptionId: subscription.id,
          billingMonth: invMonth,
          billingYear: invYear,
          periodStart: start,
          periodEnd: end,
          subscriptionAmount: Number(plan.price),
          discountAmount: Number(discount),
          totalAmount: netAmount,
          paidAmount: initialPaymentMethod ? netAmount : 0.00,
          balanceDue: initialPaymentMethod ? 0.00 : netAmount,
          status: initialPaymentMethod ? 'PAID' : 'PENDING',
          dueDate: new Date(start.getTime() + 5 * 24 * 3600 * 1000),
          items: {
            create: [
              {
                description: `${plan.name} (${start.toLocaleDateString()} to ${end.toLocaleDateString()})`,
                itemType: 'SUBSCRIPTION',
                quantity: 1,
                unitPrice: Number(plan.price),
                amount: Number(plan.price),
                date: start,
              },
            ],
          },
        },
      });

      if (initialPaymentMethod) {
        await tx.payment.create({
          data: {
            paymentNumber: `PAY-${invYear}-${customer.customerCode.replace('BMW-', '')}-${Date.now().toString().slice(-4)}`,
            invoiceId: invoice.id,
            customerId,
            amount: netAmount,
            paymentMethod: initialPaymentMethod,
            status: 'VERIFIED',
            verifiedById: req.user.id,
            verifiedAt: new Date(),
            notes: 'Payment received during subscription assignment',
          },
        });
      }

      return { subscription, invoice };
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'ASSIGN_SUBSCRIPTION', 'Subscription', result.subscription.id, req.body, req);

    whatsappService.sendNotification({
      customerId: customer.id,
      phone: customer.phone,
      templateType: 'SUBSCRIPTION_ACTIVATION',
      data: {
        customerName: customer.name,
        planName: plan.name,
        startDate: start.toLocaleDateString(),
        endDate: end.toLocaleDateString(),
        amount: netAmount,
        includedMeals: plan.includedMeals,
      },
    }).catch(err => console.error('Notification error:', err));

    return successResponse(res, 'Subscription activated successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!sub || sub.status !== 'ACTIVE') {
      return errorResponse(res, 'Active subscription not found to pause.', 400);
    }

    const updated = await prisma.$transaction([
      prisma.subscription.update({
        where: { id },
        data: {
          status: 'PAUSED',
          pausedAt: new Date(),
          notes: notes || 'Subscription paused',
        },
      }),
      prisma.customer.update({
        where: { id: sub.customerId },
        data: { status: 'PAUSED' },
      }),
    ]);

    await logAudit(req.user.id, 'PAUSE_SUBSCRIPTION', 'Subscription', id, { notes }, req);

    return successResponse(res, 'Subscription paused successfully', { subscription: updated[0] });
  } catch (error) {
    next(error);
  }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!sub || sub.status !== 'PAUSED') {
      return errorResponse(res, 'Subscription is not currently paused.', 400);
    }

    // Extend endDate by days it remained paused
    let daysToAdd = 0;
    if (sub.pausedAt) {
      const pausedDiff = Date.now() - new Date(sub.pausedAt).getTime();
      daysToAdd = Math.max(0, Math.floor(pausedDiff / (1000 * 60 * 60 * 24)));
    }

    const newEndDate = new Date(sub.endDate);
    newEndDate.setDate(newEndDate.getDate() + daysToAdd);

    const updated = await prisma.$transaction([
      prisma.subscription.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          endDate: newEndDate,
          resumeAt: new Date(),
        },
      }),
      prisma.customer.update({
        where: { id: sub.customerId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    await logAudit(req.user.id, 'RESUME_SUBSCRIPTION', 'Subscription', id, { daysExtended: daysToAdd }, req);

    return successResponse(res, `Subscription resumed. Extended by ${daysToAdd} day(s).`, { subscription: updated[0] });
  } catch (error) {
    next(error);
  }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { planId, paymentMethod } = req.body;

    const oldSub = await prisma.subscription.findUnique({
      where: { id },
      include: { customer: true, plan: true },
    });

    if (!oldSub) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    const selectedPlan = planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      : oldSub.plan;

    if (!selectedPlan) {
      return errorResponse(res, 'Target plan not found', 404);
    }

    // Start date is either old end date + 1 day or today (whichever is later)
    const baseStart = new Date(oldSub.endDate) > new Date() ? new Date(oldSub.endDate) : new Date();
    const newStart = new Date(baseStart);
    if (new Date(oldSub.endDate) > new Date()) {
      newStart.setDate(newStart.getDate() + 1);
    }

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + selectedPlan.durationDays);

    const result = await prisma.$transaction(async (tx) => {
      // Mark old sub as expired
      await tx.subscription.update({
        where: { id: oldSub.id },
        data: { status: 'EXPIRED' },
      });

      const newSub = await tx.subscription.create({
        data: {
          customerId: oldSub.customerId,
          planId: selectedPlan.id,
          startDate: newStart,
          endDate: newEnd,
          amount: selectedPlan.price,
          status: 'ACTIVE',
        },
        include: { plan: true },
      });

      await tx.customer.update({
        where: { id: oldSub.customerId },
        data: { status: 'ACTIVE' },
      });

      // Invoice
      const invMonth = newStart.getMonth() + 1;
      const invYear = newStart.getFullYear();
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${invYear}-${oldSub.customer.customerCode.replace('BMW-', '')}-${Date.now().toString().slice(-4)}`,
          customerId: oldSub.customerId,
          subscriptionId: newSub.id,
          billingMonth: invMonth,
          billingYear: invYear,
          periodStart: newStart,
          periodEnd: newEnd,
          subscriptionAmount: selectedPlan.price,
          totalAmount: selectedPlan.price,
          paidAmount: paymentMethod ? selectedPlan.price : 0.00,
          balanceDue: paymentMethod ? 0.00 : selectedPlan.price,
          status: paymentMethod ? 'PAID' : 'PENDING',
          dueDate: new Date(newStart.getTime() + 5 * 24 * 3600 * 1000),
          items: {
            create: [
              {
                description: `Renewal: ${selectedPlan.name} (${newStart.toLocaleDateString()} to ${newEnd.toLocaleDateString()})`,
                itemType: 'SUBSCRIPTION',
                quantity: 1,
                unitPrice: selectedPlan.price,
                amount: selectedPlan.price,
                date: newStart,
              },
            ],
          },
        },
      });

      if (paymentMethod) {
        await tx.payment.create({
          data: {
            paymentNumber: `PAY-${invYear}-${oldSub.customer.customerCode.replace('BMW-', '')}-${Date.now().toString().slice(-4)}`,
            invoiceId: invoice.id,
            customerId: oldSub.customerId,
            amount: selectedPlan.price,
            paymentMethod,
            status: 'VERIFIED',
            verifiedById: req.user.id,
            verifiedAt: new Date(),
            notes: 'Renewal payment verified',
          },
        });
      }

      return { subscription: newSub, invoice };
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'RENEW_SUBSCRIPTION', 'Subscription', result.subscription.id, req.body, req);

    return successResponse(res, 'Subscription renewed successfully', result);
  } catch (error) {
    next(error);
  }
};
