import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/config/db.js';

async function main() {
  console.log('Testing connection to Supabase database via Prisma Client...');
  const start = Date.now();
  try {
    const rawCheck = await prisma.$queryRaw`SELECT 1 as live_check, current_database() as db_name, version() as pg_version;`;
    const latency = Date.now() - start;
    console.log(`✅ Raw Query Success (${latency}ms):`, rawCheck);

    const userCount = await prisma.user.count();
    const customerCount = await prisma.customer.count();
    const subCount = await prisma.subscription.count();
    const settings = await prisma.businessSettings.findFirst();

    console.log(`✅ Record Counts: Users=${userCount}, Customers=${customerCount}, Subscriptions=${subCount}`);
    console.log(`✅ Business Settings:`, settings?.businessName, '| Developer:', settings?.developerName);
    console.log('🎉 Production database is verified and completely healthy!');
  } catch (err) {
    console.error('❌ Database Connection Test Failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
