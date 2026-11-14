import { PrismaClient } from '@prisma/client';

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Deva%407585@localhost:5432/messmate?schema=public',
    },
  },
});

async function check() {
  const users = await localPrisma.user.findMany();
  const customers = await localPrisma.customer.findMany();
  const staff = await localPrisma.staff.findMany();
  const subscriptions = await localPrisma.subscription.findMany();
  const attendances = await localPrisma.attendance.findMany();
  const invoices = await localPrisma.invoice.findMany();
  const invoiceItems = await localPrisma.invoiceItem.findMany();
  const payments = await localPrisma.payment.findMany();
  const plans = await localPrisma.subscriptionPlan.findMany();
  const settings = await localPrisma.businessSettings.findMany();
  const auditLogs = await localPrisma.auditLog.findMany();
  const foodMenus = await localPrisma.foodMenu.findMany();
  const extraMeals = await localPrisma.extraMeal.findMany();
  const mealRequests = await localPrisma.mealRequest.findMany();
  const notifications = await localPrisma.notification.findMany();
  const feedback = await localPrisma.feedback.findMany();
  const complaints = await localPrisma.complaint.findMany();
  const qrSessions = await localPrisma.messQrSession.findMany();
  const resetTokens = await localPrisma.passwordResetToken.findMany();

  console.log(JSON.stringify({
    users: users.length,
    customers: customers.length,
    staff: staff.length,
    plans: plans.length,
    subscriptions: subscriptions.length,
    attendances: attendances.length,
    foodMenus: foodMenus.length,
    extraMeals: extraMeals.length,
    mealRequests: mealRequests.length,
    invoices: invoices.length,
    invoiceItems: invoiceItems.length,
    payments: payments.length,
    notifications: notifications.length,
    feedback: feedback.length,
    complaints: complaints.length,
    settings: settings.length,
    auditLogs: auditLogs.length,
    resetTokens: resetTokens.length,
    qrSessions: qrSessions.length,
  }, null, 2));

  await localPrisma.$disconnect();
}

check().catch((e) => {
  console.error('Local DB Error:', e.message);
  process.exit(1);
});
