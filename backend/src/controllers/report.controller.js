import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { generateExcelBuffer } from '../utils/excelExport.js';

// Summary KPI and Analytics report
export const getAnalyticsReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const [
      totalAttendance,
      breakfastCount,
      lunchCount,
      dinnerCount,
      totalPayments,
      totalExtraMeals,
      newCustomers,
    ] = await Promise.all([
      prisma.attendance.count({ where: { date: { gte: startStr, lte: endStr } } }),
      prisma.attendance.count({ where: { date: { gte: startStr, lte: endStr }, mealType: 'BREAKFAST' } }),
      prisma.attendance.count({ where: { date: { gte: startStr, lte: endStr }, mealType: 'LUNCH' } }),
      prisma.attendance.count({ where: { date: { gte: startStr, lte: endStr }, mealType: 'DINNER' } }),
      prisma.payment.findMany({
        where: { status: 'VERIFIED', createdAt: { gte: start, lte: end } },
        select: { amount: true },
      }),
      prisma.extraMeal.count({ where: { date: { gte: startStr, lte: endStr }, status: 'APPROVED' } }),
      prisma.customer.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);

    const totalRevenue = totalPayments.reduce((s, p) => s + Number(p.amount), 0);

    return successResponse(res, 'Analytics report generated', {
      period: { startDate: startStr, endDate: endStr },
      summary: {
        totalAttendance,
        breakfastCount,
        lunchCount,
        dinnerCount,
        totalRevenue,
        totalExtraMeals,
        newCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export Full Reports to Excel
export const exportReportExcel = async (req, res, next) => {
  try {
    const { type, startDate, endDate, status } = req.query;

    let data = [];
    let fileName = `MessMate_Report_${type || 'data'}.xlsx`;

    if (type === 'revenue' || type === 'payments') {
      const payments = await prisma.payment.findMany({
        where: {
          ...(status && status !== 'ALL' && { status }),
          ...(startDate && endDate && { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }),
        },
        include: { customer: true, invoice: true },
        orderBy: { createdAt: 'desc' },
      });

      data = payments.map((p, i) => ({
        'Sr No': i + 1,
        'Payment Number': p.paymentNumber,
        'Customer Name': p.customer?.name,
        'Customer Code': p.customer?.customerCode,
        'Phone': p.customer?.phone,
        'Invoice Number': p.invoice?.invoiceNumber || 'N/A',
        'Amount (₹)': Number(p.amount),
        'Payment Method': p.paymentMethod,
        'Transaction Ref': p.transactionRef || '-',
        'Status': p.status,
        'Date': new Date(p.createdAt).toLocaleDateString(),
      }));
    } else if (type === 'customers') {
      const customers = await prisma.customer.findMany({
        where: {
          ...(status && status !== 'ALL' && { status }),
        },
        include: {
          subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      data = customers.map((c, i) => ({
        'Sr No': i + 1,
        'Customer Code': c.customerCode,
        'Name': c.name,
        'Phone': c.phone,
        'Email': c.email || '-',
        'Status': c.status,
        'Current Plan': c.subscriptions[0]?.plan?.name || 'No Active Plan',
        'Plan Expiry': c.subscriptions[0]?.endDate ? new Date(c.subscriptions[0].endDate).toLocaleDateString() : '-',
        'Joining Date': new Date(c.joiningDate).toLocaleDateString(),
      }));
    } else if (type === 'extra-meals') {
      const extraMeals = await prisma.extraMeal.findMany({
        include: { customer: true },
        orderBy: { date: 'desc' },
      });

      data = extraMeals.map((em, i) => ({
        'Sr No': i + 1,
        'Date': em.date,
        'Customer Code': em.customer?.customerCode,
        'Customer Name': em.customer?.name,
        'Meal Category': em.mealCategory,
        'Meal Type': em.mealType,
        'Count': em.count,
        'Rate (₹)': Number(em.chargePerMeal),
        'Total Amount (₹)': Number(em.totalAmount),
        'Status': em.status,
      }));
    } else {
      // Default: Attendance report
      const attendance = await prisma.attendance.findMany({
        where: {
          ...(startDate && endDate && { date: { gte: startDate, lte: endDate } }),
        },
        include: { customer: true, scannedByStaff: true },
        orderBy: { scanTime: 'desc' },
      });

      data = attendance.map((a, i) => ({
        'Sr No': i + 1,
        'Customer Code': a.customer?.customerCode,
        'Customer Name': a.customer?.name,
        'Date': a.date,
        'Meal Type': a.mealType,
        'Scan Time': new Date(a.scanTime).toLocaleTimeString(),
        'Method': a.method,
        'Scanned By': a.scannedByStaff ? a.scannedByStaff.name : 'Self Scan / Direct',
      }));
    }

    const buffer = generateExcelBuffer(data, type || 'Report');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};
