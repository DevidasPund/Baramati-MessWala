import { PrismaClient } from '@prisma/client';

// Test 1: Direct connection with URL-encoded password
const testUrl = 'postgresql://postgres:Devapund%407585@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require';

const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: testUrl,
    },
  },
});

async function testSupabase() {
  console.log('Testing Supabase direct connection...');
  try {
    const result = await supabasePrisma.$queryRaw`SELECT 1 as connected, current_database() as db_name, version() as pg_version;`;
    console.log('Supabase Connection SUCCESS:', result);
  } catch (err) {
    console.error('Direct connection failed:', err.message);
  }

  // Also test pooler connection: aws-0-ap-northeast-1.pooler.supabase.com
  const poolerUrl = 'postgresql://postgres.kaiimhojwfgefbkiwzkm:Devapund%407585@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';
  const poolerPrisma = new PrismaClient({
    datasources: {
      db: {
        url: poolerUrl,
      },
    },
  });

  console.log('Testing Supabase pooler connection...');
  try {
    const poolerResult = await poolerPrisma.$queryRaw`SELECT 1 as connected, current_database() as db_name;`;
    console.log('Supabase Pooler Connection SUCCESS:', poolerResult);
  } catch (err) {
    console.error('Pooler connection failed:', err.message);
  }

  await supabasePrisma.$disconnect();
  await poolerPrisma.$disconnect();
}

testSupabase();
