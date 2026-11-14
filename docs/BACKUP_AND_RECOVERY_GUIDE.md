# MESSMATE – DATABASE BACKUP, RESTORATION & DISASTER RECOVERY GUIDE

**Business:** Baramati Messwala  
**System:** MessMate Smart Mess & Tiffin Management  
**Developer:** Devidas Pund  

---

## 1. Backup Inventories
The project maintains redundant, timestamped backups across multiple formats:

1. **Local PostgreSQL Plaintext SQL:**
   - File: `backups/messmate_local_backup_20261114.sql` (135 KB)
   - Scope: Complete PostgreSQL schema + all tables, relations, and initial seed records.
2. **Local PostgreSQL Compressed Binary Dump:**
   - File: `backups/messmate_local_backup_20261114.dump` (80 KB)
   - Restoration tool: `pg_restore`.
3. **Structured Entity JSON Snapshots:**
   - Directory: `backups/supabase_export_latest/`
   - Complete consolidations: `backups/supabase_export_latest/messmate_complete_export.json`
   - Scope: Exact relational JSON exports of all 19 database entities.
4. **Pre-Staged Cloud Firestore Payload:**
   - File: `backups/firestore-import-payload.json`
   - Ready for one-click upload to Google Cloud Firestore.

---

## 2. Generating On-Demand Database Backups

### Creating a Fresh Supabase / PostgreSQL SQL Dump:
```powershell
# Using pg_dump
pg_dump -U postgres -h db.kaiimhojwfgefbkiwzkm.supabase.co -p 5432 -d postgres --clean -F p -f backups/messmate_backup_latest.sql
```

### Exporting All 19 Relational Entities to JSON:
```powershell
node backend/export-supabase-to-json.js
```
This automatically queries all active tables via Prisma and generates a timestamped archive folder in `backups/supabase_export_<timestamp>/` as well as updating `backups/supabase_export_latest/`.

---

## 3. Restoring PostgreSQL Databases

### Full Restoration into Local or Remote PostgreSQL:
```powershell
psql -U postgres -h localhost -p 5432 -d messmate_db -f backups/messmate_local_backup_20261114.sql
```

### Applying Prisma Schema Synchronizations:
```powershell
cd backend
npx prisma db push
```

---

## 4. Restoring Cloud Firestore Databases
To populate or restore a Cloud Firestore database from the latest snapshot:
```powershell
node backend/migrate-supabase-to-firebase.js
```
The migration script is completely idempotent: it uses Firestore `.set(docData, { merge: true })` keyed by the original record UUIDs, ensuring zero duplicate documents even if executed repeatedly.

---

## 5. Recovery Verification
After restoring, run the automated verification suite to validate all 14 business workflows:
```powershell
node backend/qa-audit-test.js
```
Ensure all tests report `[PASS]` before resuming production counter service.
