# MessMate – Database Backup, Data Safety & Disaster Recovery Guide

**Project**: MessMate – Smart Mess & Tiffin Management System  
**Business**: Baramati Messwala (बारामती मेसवाला)  
**Database**: Supabase PostgreSQL 17  
**Host**: `db.kaiimhojwfgefbkiwzkm.supabase.co:5432`  
**Database Name**: `postgres`  

---

## 1. Strict Production Data Safety Rules

> [!CAUTION]
> The Supabase database contains live client records, customers, attendance logs, and verified financial payments. The following operations are strictly prohibited in production:
> - Never execute `npx prisma migrate reset` or `npx prisma db push --force-reset`.
> - Never drop or truncate tables.
> - Never delete existing customer records.
> - Never overwrite historical attendance or verified payments.
> - Never re-run seed scripts against production.

---

## 2. Automated & On-Demand Backup Procedures

### 2.1 Automated Cloud Backups (Supabase Native)
Supabase automatically takes continuous daily physical snapshots (Point-in-Time Recovery enabled for Pro projects). Backup health can be reviewed directly in the [Supabase Dashboard](https://app.supabase.com/project/kaiimhojwfgefbkiwzkm/database/backups).

### 2.2 CLI Logical Dump Backup (Recommended Before Any DDL Changes)
To generate an independent, standalone SQL dump of the entire database:

```bash
# Set pg_dump connection string (replace credentials securely)
pg_dump "postgresql://postgres:[PASSWORD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require" \
  --format=custom \
  --file="backups/baramati_messwala_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 2.3 Automated JSON Table Export Script
A dedicated automated export tool is included in `backend/export-supabase-to-json.js`. To backup all tables to structured JSON files in `backups/`:

```bash
cd backend
node export-supabase-to-json.js
```
This exports:
- `users.json`
- `customers.json`
- `subscriptions.json`
- `attendances.json`
- `invoices.json`
- `payments.json`
- `daily_dabbas.json`
- `business_settings.json`

---

## 3. Database Schema Integrity & Constraints

The database enforces atomic data integrity through Prisma schema definitions:
1. **Attendance Uniqueness**:
   `@@unique([customerId, mealType, date], name: "unique_customer_meal_date")`
   Prevents any customer from being marked present twice for the same meal on the same date.
2. **Dabba Uniqueness**:
   `@@unique([customerId, mealType, date], name: "unique_customer_meal_date_dabba")`
   Guarantees one distinct dabba log per meal session.
3. **Invoice Uniqueness**:
   `@@unique([customerId, billingMonth, billingYear], name: "unique_customer_month_year_invoice")`
   Prevents duplicate invoice generation for the same customer in the same billing cycle.
4. **Financial Precision**: All monetary values use `Decimal @db.Decimal(10, 2)` to avoid floating-point rounding errors.
5. **Timezone Skew Prevention**: All calendar dates are stored as ISO `YYYY-MM-DD` strings (`date String`), eliminating UTC vs IST day-boundary shifting issues.

---

## 4. Disaster Recovery Procedure

In the event of accidental data corruption or hardware failure:

### Step 1: Immediate Connection Quarantine
Temporarily restrict public access to prevent inconsistent writes:
- Suspend the Render web service or set `DATABASE_URL` to maintenance mode.

### Step 2: Restore from Point-in-Time or SQL Dump
Using `pg_restore` against a clean target or existing database:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges \
  -d "postgresql://postgres:[PASSWORD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require" \
  backups/baramati_messwala_backup_YYYYMMDD.dump
```

### Step 3: Run Database Health Check
```bash
cd backend
npm run test:db
```
Confirm:
1. Raw query executes with low latency ($<1000\text{ms}$).
2. User, Customer, and Subscription counts match pre-incident records.
3. Business settings load cleanly.

### Step 4: Resume Production Services
Re-enable Render Web Service and verify `https://baramati-messwala.onrender.com/api/health`.
