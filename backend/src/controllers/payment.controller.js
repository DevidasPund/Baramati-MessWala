import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { whatsappService } from '../integrations/whatsapp.js';

// Record payment (Customer submits UPI transaction or Admin enters Cash/UPI)
export const createPayment = async (req, res, next) => {
  try {
    const { invoiceId, customerId, amount, paymentMethod = 'UPI', transactionRef, notes } = req.body;

    const targetCustomerId = req.user.role === 'CUSTOMER' ? req.user.customer?.id : customerId;
    if (!targetCustomerId) {
      return errorResponse(res, 'Customer ID is required', 400);
    }

    if (!amount || Number(amount) <= 0) {
      return errorResponse(res, 'A valid payment amount is required', 400);
    }

    const customer = await prisma.customer.findUnique({ where: { id: targetCustomerId } });
    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    let invoice = null;
    if (invoiceId) {
      invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        return errorResponse(res, 'Invoice not found', 404);
      }
    }

    const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Admin recorded payments are verified immediately; customer submissions are PENDING verification
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
    const initialStatus = isAdmin ? 'VERIFIED' : 'PENDING';

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice ? invoice.id : null,
          customerId: targetCustomerId,
          amount: Number(amount),
          paymentMethod,
          transactionRef,
          screenshotUrl,
          status: initialStatus,
          verifiedById: isAdmin ? req.user.id : null,
          verifiedAt: isAdmin ? new Date() : null,
          notes: notes || (isAdmin ? 'Recorded directly by admin' : 'Submitted by customer'),
        },
      });

      // If verified immediately by Admin, update invoice balance
      if (isAdmin && invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + Number(amount);
        const newBalance = Math.max(0, Number(invoice.totalAmount) - newPaidAmount);
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalance,
            status: newStatus,
          },
        });
      }

      return payment;
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'CREATE_PAYMENT', 'Payment', result.id, req.body, req);

    if (initialStatus === 'VERIFIED') {
      whatsappService.sendNotification({
        customerId: customer.id,
        phone: customer.phone,
        templateType: 'PAYMENT_CONFIRMATION',
        data: {
          customerName: customer.name,
          amount: Number(amount),
          invoiceNumber: invoice ? invoice.invoiceNumber : 'N/A',
          paymentNumber: result.paymentNumber,
          method: paymentMethod,
        },
      }).catch(err => console.error('Payment notification err:', err));
    }

    return successResponse(res, isAdmin ? 'Payment recorded and verified successfully.' : 'Payment submitted successfully. Awaiting admin verification.', { payment: result }, 201);
  } catch (error) {
    next(error);
  }
};

// Admin Verify or Reject Payment
export const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return errorResponse(res, 'Status must be either VERIFIED or REJECTED', 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { invoice: true, customer: true },
    });

    if (!payment) {
      return errorResponse(res, 'Payment record not found', 404);
    }

    if (payment.status === 'VERIFIED') {
      return errorResponse(res, 'This payment has already been verified.', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status,
          verifiedById: req.user.id,
          verifiedAt: new Date(),
          notes: notes ? `${payment.notes || ''} | ${notes}` : payment.notes,
        },
      });

      // When verified, update the invoice balance safely
      if (status === 'VERIFIED' && payment.invoice) {
        const inv = payment.invoice;
        const newPaidAmount = Number(inv.paidAmount) + Number(payment.amount);
        const newBalance = Math.max(0, Number(inv.totalAmount) - newPaidAmount);
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalance,
            status: newStatus,
          },
        });
      }

      return updatedPayment;
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, `PAYMENT_${status}`, 'Payment', id, { status, notes }, req);

    if (status === 'VERIFIED') {
      whatsappService.sendNotification({
        customerId: payment.customer.id,
        phone: payment.customer.phone,
        templateType: 'PAYMENT_CONFIRMATION',
        data: {
          customerName: payment.customer.name,
          amount: Number(payment.amount),
          invoiceNumber: payment.invoice ? payment.invoice.invoiceNumber : 'N/A',
          paymentNumber: payment.paymentNumber,
          method: payment.paymentMethod,
        },
      }).catch(err => console.error('Payment notification err:', err));
    }

    return successResponse(res, `Payment marked as ${status}.`, { payment: result });
  } catch (error) {
    next(error);
  }
};

// Get Payments List
export const getPayments = async (req, res, next) => {
  try {
    const { customerId, status, paymentMethod, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (status && status !== 'ALL') where.status = status;
    if (paymentMethod && paymentMethod !== 'ALL') where.paymentMethod = paymentMethod;

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
          invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, balanceDue: true } },
        },
      }),
    ]);

    return successResponse(res, 'Payments fetched', {
      payments,
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

// Owner Payment Management Statistics
export const getPaymentManagementStats = async (req, res, next) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const [monthlyCollectionResult, unpaidInvoicesResult, pendingVerifications, allInvoices, customersCount] = await Promise.all([
      // Monthly verified collection
      prisma.payment.aggregate({
        where: {
          status: 'VERIFIED',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // Pending payments sum
      prisma.invoice.aggregate({
        where: {
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        _sum: { balanceDue: true },
      }),
      // Pending payment verification requests from customers
      prisma.payment.count({
        where: { status: 'PENDING' },
      }),
      // Invoices grouped for paid / unpaid customer metrics
      prisma.invoice.findMany({
        select: {
          customerId: true,
          status: true,
          balanceDue: true,
        },
      }),
      // Approved customers count
      prisma.customer.count({
        where: { status: { in: ['ACTIVE', 'APPROVED'] } },
      }),
    ]);

    const unpaidCustomerIds = new Set(
      allInvoices
        .filter((inv) => inv.status !== 'PAID' && Number(inv.balanceDue) > 0)
        .map((inv) => inv.customerId)
    );

    const unpaidCustomersCount = unpaidCustomerIds.size;
    const paidCustomersCount = Math.max(0, customersCount - unpaidCustomersCount);

    return successResponse(res, 'Payment stats fetched', {
      totalMonthlyCollection: Number(monthlyCollectionResult._sum.amount || 0),
      pendingPaymentAmount: Number(unpaidInvoicesResult._sum.balanceDue || 0),
      paidCustomersCount,
      unpaidCustomersCount,
      totalApprovedCustomers: customersCount,
      pendingVerificationsCount: pendingVerifications,
    });
  } catch (error) {
    next(error);
  }
};

// Owner Record Cash or UPI Payment (Direct Verification)
export const recordManualOwnerPayment = async (req, res, next) => {
  try {
    const { customerId, invoiceId, amount, paymentMethod = 'CASH', transactionRef, remarks } = req.body;

    if (!customerId || !amount || Number(amount) <= 0) {
      return errorResponse(res, 'ग्राहक आणि योग्य रक्कम आवश्यक आहे.', 400);
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return errorResponse(res, 'Customer not found.', 404);
    }

    let invoice = null;
    if (invoiceId) {
      invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    }

    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId,
          invoiceId: invoice?.id || null,
          amount: Number(amount),
          paymentMethod,
          transactionRef: transactionRef || null,
          status: 'VERIFIED',
          verifiedById: req.user.id,
          verifiedAt: new Date(),
          notes: remarks ? `नोंद: ${remarks}` : `थेट मालकाद्वारे नोंदवलेले ${paymentMethod} पेमेंट`,
        },
      });

      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + Number(amount);
        const newBalance = Math.max(0, Number(invoice.totalAmount) - newPaidAmount);
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalance,
            status: newStatus,
          },
        });
      }

      return payment;
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, 'OWNER_RECORD_PAYMENT', 'Payment', result.id, {
      customerId,
      amount,
      paymentMethod,
      invoiceId,
    }, req);

    return successResponse(res, 'पेमेंट यशस्वीरीत्या नोंदवले व प्रमाणित केले गेले.', { payment: result }, 201);
  } catch (error) {
    next(error);
  }
};

// Owner Toggle Invoice Status (Mark PAID / UNPAID)
export const toggleInvoiceStatus = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { status, remarks } = req.body;

    if (!['PAID', 'UNPAID', 'PENDING'].includes(status)) {
      return errorResponse(res, 'Status must be PAID or UNPAID', 400);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      if (status === 'PAID') {
        const remainingDue = Number(invoice.balanceDue);
        if (remainingDue > 0) {
          const count = await tx.payment.count();
          const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
          await tx.payment.create({
            data: {
              paymentNumber,
              invoiceId: invoice.id,
              customerId: invoice.customerId,
              amount: remainingDue,
              paymentMethod: 'CASH',
              status: 'VERIFIED',
              verifiedById: req.user.id,
              verifiedAt: new Date(),
              notes: remarks ? `मालकाने PAID केले: ${remarks}` : 'मालकाद्वारे थेट PAID केले गेले',
            },
          });
        }

        return await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: invoice.totalAmount,
            balanceDue: 0.00,
            status: 'PAID',
            notes: remarks ? `${invoice.notes || ''} | ${remarks}` : invoice.notes,
          },
        });
      } else {
        // Mark UNPAID / PENDING
        return await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: 0.00,
            balanceDue: invoice.totalAmount,
            status: 'PENDING',
            notes: remarks ? `${invoice.notes || ''} | UNPAID: ${remarks}` : invoice.notes,
          },
        });
      }
    }, { maxWait: 15000, timeout: 35000 });

    await logAudit(req.user.id, `INVOICE_MARKED_${status}`, 'Invoice', invoiceId, { remarks }, req);

    return successResponse(res, `बिल यशस्वीरीत्या ${status} म्हणून चिन्हांकित केले गेले.`, { invoice: result });
  } catch (error) {
    next(error);
  }
};

// Customer-wise Payment History for Owner
export const getCustomerPaymentHistory = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const [customer, payments, invoices] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, phone: true, customerCode: true, status: true },
      }),
      prisma.payment.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: { select: { invoiceNumber: true, totalAmount: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
    ]);

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    return successResponse(res, 'Customer payment history fetched', {
      customer,
      payments,
      invoices,
    });
  } catch (error) {
    next(error);
  }
};
