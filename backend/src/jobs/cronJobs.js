import cron from 'node-cron';
import prisma from '../config/db.js';
import { whatsappService } from '../integrations/whatsapp.js';

export const initCronJobs = () => {
  console.log('[Cron Jobs] Initializing automated background schedulers...');

  // 1. Daily morning job at 08:00 AM: Check expiring subscriptions and send reminders
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('[Cron Job: 08:00 AM] Checking subscriptions for expiry reminders...');
      const settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
      const reminderDays = (settings?.expiryReminderDays || '7,3,1')
        .split(',')
        .map((d) => parseInt(d.trim(), 10))
        .filter(Boolean);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const activeSubscriptions = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { customer: true, plan: true },
      });

      for (const sub of activeSubscriptions) {
        const endDate = new Date(sub.endDate);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (reminderDays.includes(diffDays)) {
          console.log(`[Expiry Alert] Customer ${sub.customer.name} has ${diffDays} day(s) left on plan ${sub.plan.name}`);

          await whatsappService.sendNotification({
            customerId: sub.customerId,
            phone: sub.customer.phone,
            templateType: diffDays === 1 ? 'RENEWAL_REMINDER' : 'EXPIRY_REMINDER',
            data: {
              customerName: sub.customer.name,
              planName: sub.plan.name,
              endDate: endDate.toLocaleDateString(),
              daysLeft: diffDays,
            },
          });
        }
      }
    } catch (error) {
      console.error('[Cron Job Error - Expiry Reminders]:', error);
    }
  });

  // 2. Midnight job: Auto-expire past subscriptions
  cron.schedule('5 0 * * *', async () => {
    try {
      console.log('[Cron Job: Midnight] Marking past subscriptions as EXPIRED...');
      const now = new Date();

      const expiredSubs = await prisma.subscription.updateMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: now },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      if (expiredSubs.count > 0) {
        console.log(`[Cron Job] Marked ${expiredSubs.count} expired subscriptions.`);
      }
    } catch (error) {
      console.error('[Cron Job Error - Auto Expire]:', error);
    }
  });
};
