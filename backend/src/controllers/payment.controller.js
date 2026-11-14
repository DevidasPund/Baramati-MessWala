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
