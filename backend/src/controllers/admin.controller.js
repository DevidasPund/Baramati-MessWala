import prisma from '../config/db.js';
import { successResponse } from '../utils/response.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    // 7 days date range
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const min7DayStr = sevenDaysAgo.toISOString().split('T')[0];

    // 6 months date range
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);

    // Execute queries in structured batches to prevent connection pool exhaustion
    const [
      customerCounts,
      todayAttendances,
      recent7DaysAttendance,
      monthlyVerifiedPayments,
      todayDabbasGroup,
    ] = await Promise.all([
      // 1. Customer Counts grouped by status
      prisma.customer.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // 2. Today's attendance grouped by meal type
      prisma.attendance.groupBy({
        by: ['mealType'],
        where: { date: todayStr },
        _count: { id: true },
      }),

      // 3. Last 7 days attendance batch
      prisma.attendance.findMany({
        where: { date: { gte: min7DayStr, lte: todayStr } },
        select: { date: true, mealType: true },
      }),

      // 4. Monthly verified revenue aggregate
      prisma.payment.aggregate({
        where: {
          status: 'VERIFIED',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),

      // 5. Today's dabbas grouped by status
      prisma.dailyDabba.groupBy({
        by: ['status'],
        where: { date: todayStr },
        _count: { id: true },
      }),
    ]);

    const [
      last6MonthsPayments,
      unpaidInvoices,
      expiringSubscriptions,
      plansWithSubs,
    ] = await Promise.all([
      // 5. Last 6 months payments batch
      prisma.payment.findMany({
        where: {
          status: 'VERIFIED',
          createdAt: { gte: sixMonthsAgo },
        },
        select: { amount: true, createdAt: true },
      }),

      // 6. Pending payments aggregate
      prisma.invoice.aggregate({
        where: { status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { balanceDue: true },
      }),

      // 7. Expiring subscriptions in next 7 days
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endDate: { gte: today, lte: in7Days },
        },
      }),

      // 8. Subscription distribution by plan
      prisma.subscriptionPlan.findMany({
        select: {
          name: true,
          code: true,
          _count: {
            select: { subscriptions: { where: { status: 'ACTIVE' } } },
          },
        },
      }),
    ]);

    const [
      recentAttendance,
      recentPayments,
      recentCustomers,
      pendingExtraMeals,
      pendingComplaints,
      outstandingInvoicesList,
      newCustomersThisMonthCount,
    ] = await Promise.all([
      // 9. Recent activities (5 of each)
      prisma.attendance.findMany({
        take: 5,
        orderBy: { scanTime: 'desc' },
        include: { customer: { select: { name: true, customerCode: true } } },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, customerCode: true } } },
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, customerCode: true, phone: true, status: true, createdAt: true },
      }),
      prisma.extraMeal.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, customerCode: true } } },
      }),
      prisma.complaint.findMany({
        where: { status: 'OPEN' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, customerCode: true } } },
      }),
      // 14. Outstanding Invoices with customer and plan details for dashboard table
      prisma.invoice.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
          balanceDue: { gt: 0 },
        },
        take: 10,
        orderBy: { balanceDue: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              phone: true,
              subscriptions: {
                where: { status: 'ACTIVE' },
                take: 1,
                include: { plan: { select: { name: true } } },
              },
            },
          },
        },
      }),
      // 15. New Customers registered this month
      prisma.customer.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    // Process Customer Counts in-memory
    let activeCustomers = 0;
    let inactiveCustomers = 0;
    let pausedCustomers = 0;
    let pendingApprovalCustomers = 0;
    let approvedCustomers = 0;
    let totalCustomers = 0;
    for (const c of customerCounts) {
      totalCustomers += c._count.id;
      if (c.status === 'ACTIVE') activeCustomers = c._count.id;
      if (c.status === 'APPROVED') approvedCustomers = c._count.id;
      if (c.status === 'PENDING_APPROVAL') pendingApprovalCustomers = c._count.id;
      if (c.status === 'INACTIVE') inactiveCustomers = c._count.id;
      if (c.status === 'PAUSED') pausedCustomers = c._count.id;
    }
    const totalApprovedCustomers = activeCustomers + approvedCustomers;

    // Process Today's Dabbas in-memory
    let dabbaPrepared = 0;
    let dabbaGiven = 0;
    let dabbaReturned = 0;
    let todayDabbaCount = 0;
    for (const d of todayDabbasGroup) {
      todayDabbaCount += d._count.id;
      if (d.status === 'PREPARED') dabbaPrepared = d._count.id;
      if (d.status === 'GIVEN') dabbaGiven = d._count.id;
      if (d.status === 'RETURNED') dabbaReturned = d._count.id;
    }

    // Process Today's Attendance in-memory
    let todayBreakfast = 0;
    let todayLunch = 0;
    let todayDinner = 0;
    let todayTotalAttendance = 0;
    for (const a of todayAttendances) {
      todayTotalAttendance += a._count.id;
      if (a.mealType === 'BREAKFAST') todayBreakfast = a._count.id;
      if (a.mealType === 'LUNCH') todayLunch = a._count.id;
      if (a.mealType === 'DINNER') todayDinner = a._count.id;
    }

    const monthlyRevenue = Number(monthlyVerifiedPayments._sum?.amount || 0);
    const pendingPayments = Number(unpaidInvoices._sum?.balanceDue || 0);
    const activeSubscriptions = plansWithSubs.reduce((acc, p) => acc + (p._count?.subscriptions || 0), 0);
    const totalExtraMeals = (recentAttendance.length || 0) + (pendingExtraMeals.length || 0);
    const todayRevenue = Math.round(monthlyRevenue / 30);

    // Process 7-day attendance trend in-memory
    const attendanceMap = new Map();
    for (const rec of recent7DaysAttendance) {
      if (!attendanceMap.has(rec.date)) {
        attendanceMap.set(rec.date, { total: 0, breakfast: 0, lunch: 0, dinner: 0 });
      }
      const dayData = attendanceMap.get(rec.date);
      dayData.total += 1;
      if (rec.mealType === 'BREAKFAST') dayData.breakfast += 1;
      if (rec.mealType === 'LUNCH') dayData.lunch += 1;
      if (rec.mealType === 'DINNER') dayData.dinner += 1;
    }

    const dailyAttendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const counts = attendanceMap.get(dStr) || { total: 0, breakfast: 0, lunch: 0, dinner: 0 };
      dailyAttendanceTrend.push({
        date: dStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: counts.total,
        breakfast: counts.breakfast,
        lunch: counts.lunch,
        dinner: counts.dinner,
      });
    }

    // Process 6-month revenue trend in-memory
    const revenueMap = new Map();
    for (const pay of last6MonthsPayments) {
      const pDate = new Date(pay.createdAt);
      const key = `${pDate.getFullYear()}-${pDate.getMonth() + 1}`;
      revenueMap.set(key, (revenueMap.get(key) || 0) + Number(pay.amount));
    }

    const revenueTrend = [];
    for (let m = 5; m >= 0; m--) {
      const mDate = new Date(currentYear, currentMonth - 1 - m, 1);
      const key = `${mDate.getFullYear()}-${mDate.getMonth() + 1}`;
      const rev = revenueMap.get(key) || 0;
      revenueTrend.push({
        month: mDate.toLocaleDateString('en-US', { month: 'short' }),
        year: mDate.getFullYear(),
        revenue: rev,
      });
    }

    // Subscription Distribution
    const subscriptionDistribution = plansWithSubs.map((plan) => ({
      name: plan.name,
      count: plan._count.subscriptions,
      code: plan.code,
    }));

    return successResponse(res, 'Dashboard metrics retrieved', {
      kpis: {
        totalCustomers,
        totalApprovedCustomers,
        pendingCustomerVerification: pendingApprovalCustomers,
        todayDabbaCount,
        dabbaPrepared,
        dabbaGiven,
        dabbaReturned,
        todayAttendance: todayTotalAttendance,
        monthlyCollection: monthlyRevenue,
        pendingPayments,
        activeCustomers,
        inactiveCustomers,
        pausedCustomers,
        todayTotalAttendance,
        todayBreakfast,
        todayLunch,
        todayDinner,
        monthlyRevenue,
        todayRevenue,
        pendingCustomersCount: outstandingInvoicesList?.length || 0,
        newCustomersThisMonth: newCustomersThisMonthCount || 0,
        activeSubscriptions,
        expiringSubscriptions,
        totalExtraMeals,
      },
      outstandingCustomers: (outstandingInvoicesList || []).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customer?.id,
        customerName: inv.customer?.name || 'अज्ञात ग्राहक',
        customerCode: inv.customer?.customerCode || '',
        phone: inv.customer?.phone || '',
        planName: inv.customer?.subscriptions?.[0]?.plan?.name || 'नियमित मासिक मेस',
        balanceDue: Number(inv.balanceDue || 0),
        totalAmount: Number(inv.totalAmount || 0),
        dueDate: inv.dueDate,
        status: inv.status,
      })),
      charts: {
        dailyAttendanceTrend,
        revenueTrend,
        subscriptionDistribution,
        activeVsInactive: [
          { name: 'Active', value: activeCustomers, color: '#10b981' },
          { name: 'Paused', value: pausedCustomers, color: '#f59e0b' },
          { name: 'Inactive', value: inactiveCustomers, color: '#ef4444' },
        ],
        mealWiseToday: [
          { name: 'Breakfast', count: todayBreakfast, color: '#f97316' },
          { name: 'Lunch', count: todayLunch, color: '#059669' },
          { name: 'Dinner', count: todayDinner, color: '#0284c7' },
        ],
      },
      activities: {
        recentAttendance,
        recentPayments,
        recentCustomers,
        pendingExtraMeals,
        pendingComplaints,
      },
    });
  } catch (error) {
    next(error);
  }
};
