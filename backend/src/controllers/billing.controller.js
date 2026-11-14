import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { generateInvoicePDF } from '../utils/pdfInvoice.js';
import { whatsappService } from '../integrations/whatsapp.js';

// Generate Bill for a single customer or batch for all active customers
export const generateMonthlyBills = async (req, res, next) => {
  try {
    const { customerId, month, year, dueDate } = req.body;

    const billingMonth = Number(month) || new Date().getMonth() + 1;
    const billingYear = Number(year) || new Date().getFullYear();

    const periodStart = new Date(billingYear, billingMonth - 1, 1);
    const periodEnd = new Date(billingYear, billingMonth, 0, 23, 59, 59);
    const invoiceDueDate = dueDate ? new Date(dueDate) : new Date(billingYear, billingMonth - 1, 10);

    // Target customers
    const customers = await prisma.customer.findMany({
      where: {
        ...(customerId ? { id: customerId } : { status: { in: ['ACTIVE', 'PAUSED'] } }),
      },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customers.length) {
      return errorResponse(res, 'No eligible customers found for bill generation.', 404);
    }

    const generatedInvoices = [];
    const skippedCustomers = [];

    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });

    for (const cust of customers) {
      // Check if invoice already exists for this period
      const existing = await prisma.invoice.findUnique({
        where: {
          unique_customer_month_year_invoice: {
            customerId: cust.id,
            billingMonth,
            billingYear,
          },
        },
      });

      if (existing) {
        skippedCustomers.push({ customer: cust.name, reason: 'Invoice already exists for this month/year' });
        continue;
      }

      const activeSub = cust.subscriptions[0];
      const subscriptionAmount = activeSub ? Number(activeSub.amount) : 0.00;

      // Calculate approved unbilled extra meals in this period
      const startStr = periodStart.toISOString().split('T')[0];
      const endStr = periodEnd.toISOString().split('T')[0];

      const extraMeals = await prisma.extraMeal.findMany({
        where: {
          customerId: cust.id,
          status: 'APPROVED',
          date: { gte: startStr, lte: endStr },
          invoiceId: null, // unbilled
        },
      });

      let extraMealCharges = 0;
      let guestMealCharges = 0;
      const invoiceLineItems = [];

      if (activeSub) {
        invoiceLineItems.push({
          description: `${activeSub.plan.name} (${billingMonth}/${billingYear})`,
          itemType: 'SUBSCRIPTION',
          quantity: 1,
          unitPrice: subscriptionAmount,
          amount: subscriptionAmount,
          date: periodStart,
        });
      }

      extraMeals.forEach((em) => {
        const amt = Number(em.totalAmount);
        if (em.mealCategory === 'GUEST_MEAL') {
          guestMealCharges += amt;
          invoiceLineItems.push({
            description: `Guest Meal (${em.count}x ${em.mealType} on ${em.date})`,
            itemType: 'GUEST_MEAL',
            quantity: em.count,
            unitPrice: em.chargePerMeal,
            amount: amt,
            date: new Date(em.date),
          });
        } else {
          extraMealCharges += amt;
          invoiceLineItems.push({
            description: `Extra Meal (${em.count}x ${em.mealType} on ${em.date})`,
            itemType: 'EXTRA_MEAL',
            quantity: em.count,
            unitPrice: em.chargePerMeal,
            amount: amt,
            date: new Date(em.date),
          });
        }
      });

      const totalAmount = subscriptionAmount + extraMealCharges + guestMealCharges;
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${billingYear}-${String(count + 1).padStart(4, '0')}`;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: cust.id,
          subscriptionId: activeSub ? activeSub.id : null,
          billingMonth,
          billingYear,
          periodStart,
          periodEnd,
          subscriptionAmount,
          extraMealCharges,
          guestMealCharges,
          totalAmount,
          paidAmount: 0.00,
          balanceDue: totalAmount,
          status: 'PENDING',
          isApprovedByAdmin: true,
          dueDate: invoiceDueDate,
          items: {
            create: invoiceLineItems,
          },
        },
        include: {
          items: true,
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        },
      });

      // Link extra meals to this invoice
      if (extraMeals.length > 0) {
        await prisma.extraMeal.updateMany({
          where: { id: { in: extraMeals.map((m) => m.id) } },
          data: { invoiceId: invoice.id },
        });
      }

      generatedInvoices.push(invoice);

      // Notify customer via WhatsApp service
      whatsappService.sendNotification({
        customerId: cust.id,
        phone: cust.phone,
        templateType: 'BILL_GENERATED',
        data: {
          customerName: cust.name,
          monthYear: `${billingMonth}/${billingYear}`,
          invoiceNumber: invoice.invoiceNumber,
          subscriptionAmount,
          extraMealAmount: extraMealCharges + guestMealCharges,
          totalAmount,
          dueDate: invoiceDueDate.toLocaleDateString(),
        },
      }).catch(err => console.error('Bill notification err:', err));
    }

    await logAudit(req.user.id, 'GENERATE_MONTHLY_BILLS', 'Invoice', null, {
      month: billingMonth,
      year: billingYear,
      generatedCount: generatedInvoices.length,
    }, req);

    return successResponse(res, `Billing process completed: ${generatedInvoices.length} invoices generated, ${skippedCustomers.length} skipped.`, {
      generatedCount: generatedInvoices.length,
      skippedCount: skippedCustomers.length,
      skippedCustomers,
      invoices: generatedInvoices,
    }, 201);
  } catch (error) {
    next(error);
  }
};

// Get Invoices List
export const getInvoices = async (req, res, next) => {
  try {
    const { customerId, status, month, year, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (status && status !== 'ALL') where.status = status;
    if (month) where.billingMonth = Number(month);
    if (year) where.billingYear = Number(year);

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
          payments: true,
          items: true,
        },
      }),
    ]);

    return successResponse(res, 'Invoices fetched', {
      invoices,
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

// Get Invoice by ID
export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
        subscription: { include: { plan: true } },
      },
    });

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Customer security check
    if (req.user.role === 'CUSTOMER' && invoice.customerId !== req.user.customer?.id) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, 'Invoice details fetched', { invoice });
  } catch (error) {
    next(error);
  }
};

// Download PDF Invoice
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    if (req.user.role === 'CUSTOMER' && invoice.customerId !== req.user.customer?.id) {
      return errorResponse(res, 'Access denied', 403);
    }

    const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });

    const pdfBuffer = await generateInvoicePDF(invoice, invoice.customer, invoice.items, settings || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
