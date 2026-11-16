import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/config/db.js';

async function migrate() {
  console.log('--- EXECUTING SAFE NON-DESTRUCTIVE DATABASE SCHEMA EXTENSIONS ---');
  try {
    // 1. Extend CustomerStatus enum safely
    const enumValues = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'];
    for (const val of enumValues) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "CustomerStatus" ADD VALUE IF NOT EXISTS '${val}';`);
        console.log(`✔ Added/Verified CustomerStatus enum value: ${val}`);
      } catch (err) {
        // PostgreSQL might throw if value already exists in older PG versions, or IF NOT EXISTS handles it
        console.log(`ℹ CustomerStatus enum ${val}: ${err.message}`);
      }
    }

    // 2. Add new columns to Customer safely
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "firebaseUid" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN DEFAULT false;`);
    console.log('✔ Customer table columns verified.');

    // 3. Create DabbaStatus enum if not exists
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DabbaStatus') THEN
            CREATE TYPE "DabbaStatus" AS ENUM ('PREPARED', 'GIVEN', 'RETURNED');
          END IF;
        END $$;
      `);
      console.log('✔ DabbaStatus enum verified.');
    } catch (err) {
      console.log(`ℹ DabbaStatus enum notice: ${err.message}`);
    }

    // 4. Create DailyDabba table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyDabba" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "customerId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "mealType" "MealType" NOT NULL,
        "status" "DabbaStatus" NOT NULL DEFAULT 'PREPARED',
        "givenAt" TIMESTAMP(3),
        "returnedAt" TIMESTAMP(3),
        "recordedById" TEXT,
        "remarks" TEXT,
        "correctionReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DailyDabba_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✔ DailyDabba table verified.');

    // 5. Create indices and unique constraint for DailyDabba
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "unique_customer_meal_date_dabba" 
        ON "DailyDabba"("customerId", "mealType", "date");
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DailyDabba_date_idx" ON "DailyDabba"("date");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DailyDabba_mealType_idx" ON "DailyDabba"("mealType");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DailyDabba_status_idx" ON "DailyDabba"("status");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DailyDabba_customerId_idx" ON "DailyDabba"("customerId");`);
      console.log('✔ DailyDabba indices verified.');
    } catch (err) {
      console.log(`ℹ Index notice: ${err.message}`);
    }

    console.log('🎉 Safe schema extensions completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
