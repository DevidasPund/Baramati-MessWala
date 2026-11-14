import { PrismaClient } from '@prisma/client';

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Deva%407585@localhost:5432/messmate?schema=public',
    },
  },
});

const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Devapund%407585@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require',
    },
  },
});

async function runMigration() {
  console.log('========================================================================');
  console.log('  STARTING MESSMATE DATA MIGRATION: LOCAL POSTGRESQL 17 -> SUPABASE');
  console.log('  Project ID: kaiimhojwfgefbkiwzkm | Client: Baramati Messwala');
  console.log('========================================================================\n');

  try {
    // 1. BusinessSettings
    console.log('[1/19] Migrating BusinessSettings...');
    const localSettings = await localPrisma.businessSettings.findMany();
    for (const item of localSettings) {
      await supabasePrisma.businessSettings.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localSettings.length} BusinessSettings records.`);

    // 2. User
    console.log('[2/19] Migrating Users...');
    const localUsers = await localPrisma.user.findMany();
    for (const item of localUsers) {
      await supabasePrisma.user.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localUsers.length} Users.`);

    // 3. Staff
    console.log('[3/19] Migrating Staff...');
    const localStaff = await localPrisma.staff.findMany();
    for (const item of localStaff) {
      await supabasePrisma.staff.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localStaff.length} Staff members.`);

    // 4. Customer
    console.log('[4/19] Migrating Customers...');
    const localCustomers = await localPrisma.customer.findMany();
    for (const item of localCustomers) {
      await supabasePrisma.customer.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localCustomers.length} Customers.`);

    // 5. SubscriptionPlan
    console.log('[5/19] Migrating Subscription Plans...');
    const localPlans = await localPrisma.subscriptionPlan.findMany();
    for (const item of localPlans) {
      await supabasePrisma.subscriptionPlan.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localPlans.length} Subscription Plans.`);

    // 6. Subscription
    console.log('[6/19] Migrating Subscriptions...');
    const localSubscriptions = await localPrisma.subscription.findMany();
    for (const item of localSubscriptions) {
      await supabasePrisma.subscription.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localSubscriptions.length} Subscriptions.`);

    // 7. MessQrSession
    console.log('[7/19] Migrating MessQrSession...');
    const localQrSessions = await localPrisma.messQrSession.findMany();
    for (const item of localQrSessions) {
      await supabasePrisma.messQrSession.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localQrSessions.length} Mess QR Sessions.`);

    // 8. FoodMenu
    console.log('[8/19] Migrating Food Menus...');
    const localMenus = await localPrisma.foodMenu.findMany();
    for (const item of localMenus) {
      await supabasePrisma.foodMenu.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localMenus.length} Food Menu entries.`);

    // 9. Attendance
    console.log('[9/19] Migrating Attendance Records...');
    const localAttendance = await localPrisma.attendance.findMany();
    for (const item of localAttendance) {
      await supabasePrisma.attendance.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localAttendance.length} Attendance records.`);

    // 10. MealRequest
    console.log('[10/19] Migrating Meal Requests...');
    const localMealRequests = await localPrisma.mealRequest.findMany();
    for (const item of localMealRequests) {
      await supabasePrisma.mealRequest.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localMealRequests.length} Meal Requests.`);

    // 11. Invoice
    console.log('[11/19] Migrating Invoices...');
    const localInvoices = await localPrisma.invoice.findMany();
    for (const item of localInvoices) {
      await supabasePrisma.invoice.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localInvoices.length} Invoices.`);

    // 12. InvoiceItem
    console.log('[12/19] Migrating Invoice Items...');
    const localInvoiceItems = await localPrisma.invoiceItem.findMany();
    for (const item of localInvoiceItems) {
      await supabasePrisma.invoiceItem.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localInvoiceItems.length} Invoice Items.`);

    // 13. ExtraMeal
    console.log('[13/19] Migrating Extra Meals...');
    const localExtraMeals = await localPrisma.extraMeal.findMany();
    for (const item of localExtraMeals) {
      await supabasePrisma.extraMeal.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localExtraMeals.length} Extra Meals.`);

    // 14. Payment
    console.log('[14/19] Migrating Payments...');
    const localPayments = await localPrisma.payment.findMany();
    for (const item of localPayments) {
      await supabasePrisma.payment.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localPayments.length} Payments.`);

    // 15. Notification
    console.log('[15/19] Migrating Notifications...');
    const localNotifications = await localPrisma.notification.findMany();
    for (const item of localNotifications) {
      await supabasePrisma.notification.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localNotifications.length} Notifications.`);

    // 16. Feedback
    console.log('[16/19] Migrating Feedback...');
    const localFeedback = await localPrisma.feedback.findMany();
    for (const item of localFeedback) {
      await supabasePrisma.feedback.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localFeedback.length} Feedback records.`);

    // 17. Complaint
    console.log('[17/19] Migrating Complaints...');
    const localComplaints = await localPrisma.complaint.findMany();
    for (const item of localComplaints) {
      await supabasePrisma.complaint.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localComplaints.length} Complaints.`);

    // 18. AuditLog
    console.log('[18/19] Migrating Audit Logs...');
    const localAuditLogs = await localPrisma.auditLog.findMany();
    for (const item of localAuditLogs) {
      await supabasePrisma.auditLog.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localAuditLogs.length} Audit Logs.`);

    // 19. PasswordResetToken
    console.log('[19/19] Migrating Password Reset Tokens...');
    const localResetTokens = await localPrisma.passwordResetToken.findMany();
    for (const item of localResetTokens) {
      await supabasePrisma.passwordResetToken.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`✔ Migrated ${localResetTokens.length} Password Reset Tokens.`);

    console.log('\n========================================================================');
    console.log('  DATA TRANSFER COMPLETED! RUNNING VERIFICATION COUNTS...');
    console.log('========================================================================\n');

    // Verification side-by-side
    const comparison = [
      { entity: 'BusinessSettings', source: (await localPrisma.businessSettings.count()), dest: (await supabasePrisma.businessSettings.count()) },
      { entity: 'User', source: (await localPrisma.user.count()), dest: (await supabasePrisma.user.count()) },
      { entity: 'Staff', source: (await localPrisma.staff.count()), dest: (await supabasePrisma.staff.count()) },
      { entity: 'Customer', source: (await localPrisma.customer.count()), dest: (await supabasePrisma.customer.count()) },
      { entity: 'SubscriptionPlan', source: (await localPrisma.subscriptionPlan.count()), dest: (await supabasePrisma.subscriptionPlan.count()) },
      { entity: 'Subscription', source: (await localPrisma.subscription.count()), dest: (await supabasePrisma.subscription.count()) },
      { entity: 'MessQrSession', source: (await localPrisma.messQrSession.count()), dest: (await supabasePrisma.messQrSession.count()) },
      { entity: 'FoodMenu', source: (await localPrisma.foodMenu.count()), dest: (await supabasePrisma.foodMenu.count()) },
      { entity: 'Attendance', source: (await localPrisma.attendance.count()), dest: (await supabasePrisma.attendance.count()) },
      { entity: 'MealRequest', source: (await localPrisma.mealRequest.count()), dest: (await supabasePrisma.mealRequest.count()) },
      { entity: 'Invoice', source: (await localPrisma.invoice.count()), dest: (await supabasePrisma.invoice.count()) },
      { entity: 'InvoiceItem', source: (await localPrisma.invoiceItem.count()), dest: (await supabasePrisma.invoiceItem.count()) },
      { entity: 'ExtraMeal', source: (await localPrisma.extraMeal.count()), dest: (await supabasePrisma.extraMeal.count()) },
      { entity: 'Payment', source: (await localPrisma.payment.count()), dest: (await supabasePrisma.payment.count()) },
      { entity: 'Notification', source: (await localPrisma.notification.count()), dest: (await supabasePrisma.notification.count()) },
      { entity: 'Feedback', source: (await localPrisma.feedback.count()), dest: (await supabasePrisma.feedback.count()) },
      { entity: 'Complaint', source: (await localPrisma.complaint.count()), dest: (await supabasePrisma.complaint.count()) },
      { entity: 'AuditLog', source: (await localPrisma.auditLog.count()), dest: (await supabasePrisma.auditLog.count()) },
      { entity: 'PasswordResetToken', source: (await localPrisma.passwordResetToken.count()), dest: (await supabasePrisma.passwordResetToken.count()) },
    ];

    console.table(comparison);

    let allMatched = true;
    for (const row of comparison) {
      if (row.source !== row.dest) {
        console.error(`❌ Mismatch in ${row.entity}: Source=${row.source}, Destination=${row.dest}`);
        allMatched = false;
      }
    }

    if (allMatched) {
      console.log('✅ PERFECT MIGRATION: All 19 entity counts match 100% exactly!');
    } else {
      console.error('❌ MIGRATION WARNING: One or more entity counts did not match.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration Fatal Error:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
}

runMigration();
