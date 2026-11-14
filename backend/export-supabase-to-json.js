import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportAllSupabaseData() {
  console.log('====================================================');
  console.log('  MESSMATE: SUPABASE TO FIREBASE DATA EXPORT UTILITY');
  console.log('  Target: Baramati Messwala | Developer: Devidas Pund');
  console.log('====================================================\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../backups', `supabase_export_${timestamp}`);
  const latestDir = path.resolve(__dirname, '../backups/supabase_export_latest');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(latestDir, { recursive: true });

  const exportEntities = [
    { name: 'businessSettings', query: () => prisma.businessSettings.findMany() },
    { name: 'users', query: () => prisma.user.findMany() },
    { name: 'staff', query: () => prisma.staff.findMany() },
    { name: 'customers', query: () => prisma.customer.findMany() },
    { name: 'subscriptionPlans', query: () => prisma.subscriptionPlan.findMany() },
    { name: 'subscriptions', query: () => prisma.subscription.findMany() },
    { name: 'messQrSessions', query: () => prisma.messQrSession.findMany() },
    { name: 'foodMenu', query: () => prisma.foodMenu.findMany() },
    { name: 'attendance', query: () => prisma.attendance.findMany() },
    { name: 'mealRequests', query: () => prisma.mealRequest.findMany() },
    { name: 'invoices', query: () => prisma.invoice.findMany() },
    { name: 'invoiceItems', query: () => prisma.invoiceItem.findMany() },
    { name: 'extraMeals', query: () => prisma.extraMeal.findMany() },
    { name: 'payments', query: () => prisma.payment.findMany() },
    { name: 'notifications', query: () => prisma.notification.findMany() },
    { name: 'feedback', query: () => prisma.feedback.findMany() },
    { name: 'complaints', query: () => prisma.complaint.findMany() },
    { name: 'auditLogs', query: () => prisma.auditLog.findMany() },
    { name: 'passwordResetTokens', query: () => prisma.passwordResetToken.findMany() },
  ];

  const fullExport = {
    metadata: {
      exportedAt: new Date().toISOString(),
      source: 'Supabase PostgreSQL (Project ID: kaiimhojwfgefbkiwzkm)',
      business: 'Baramati Messwala',
      developer: 'Devidas Pund',
      application: 'MessMate Smart Mess & Tiffin Management System',
    },
    counts: {},
    data: {},
  };

  for (const entity of exportEntities) {
    try {
      console.log(`Exporting entity: ${entity.name}...`);
      const records = await entity.query();
      fullExport.counts[entity.name] = records.length;
      fullExport.data[entity.name] = records;

      const entityFilePath = path.join(backupDir, `${entity.name}.json`);
      fs.writeFileSync(entityFilePath, JSON.stringify(records, null, 2), 'utf-8');

      const latestFilePath = path.join(latestDir, `${entity.name}.json`);
      fs.writeFileSync(latestFilePath, JSON.stringify(records, null, 2), 'utf-8');

      console.log(`  âœ“ ${entity.name}: ${records.length} records exported`);
    } catch (err) {
      console.error(`  âœ— Error exporting ${entity.name}:`, err.message);
      fullExport.counts[entity.name] = -1;
    }
  }

  const consolidatedPath = path.join(backupDir, 'messmate_complete_export.json');
  fs.writeFileSync(consolidatedPath, JSON.stringify(fullExport, null, 2), 'utf-8');

  const latestConsolidatedPath = path.join(latestDir, 'messmate_complete_export.json');
  fs.writeFileSync(latestConsolidatedPath, JSON.stringify(fullExport, null, 2), 'utf-8');

  console.log('\n====================================================');
  console.log('EXPORT COMPLETED SUCCESSFULLY!');
  console.log(`Timestamped Archive: ${consolidatedPath}`);
  console.log(`Latest Snapshot:     ${latestConsolidatedPath}`);
  console.log('Entity Counts Summary:');
  console.table(fullExport.counts);
  console.log('====================================================\n');

  await prisma.$disconnect();
}

exportAllSupabaseData().catch((err) => {
  console.error('Fatal export failure:', err);
  process.exit(1);
});
