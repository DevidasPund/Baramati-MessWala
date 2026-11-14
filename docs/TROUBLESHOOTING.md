# MessMate Production Deployment Troubleshooting Guide
**Baramati Messwala – Smart Mess & Tiffin Management System**  
*Lead Architect: Devidas Pund*

---

## 1. CORS Errors (Cross-Origin Resource Sharing)

### Symptom
Browser console displays:
`Access to XMLHttpRequest at 'https://messmate-backend.onrender.com/api/auth/login' from origin 'https://baramati-messwala.vercel.app' has been blocked by CORS policy.`

### Root Cause
The incoming request `Origin` header does not match any entry in `allowedOrigins` or end with `.vercel.app`.

### Solution
1. In the **Render Dashboard** -> Your Web Service -> **Environment**:
   Update `FRONTEND_URL` to include your production domain(s):
   ```env
   FRONTEND_URL=https://baramatimesswala.com,https://baramati-messwala.vercel.app
   ```
2. Note that `backend/src/app.js` is already coded to automatically allow any domain ending with `.vercel.app` (including preview branches) and trims any trailing slashes.

---

## 2. Supabase PostgreSQL Connection Timeouts / Pool Exhaustion

### Symptom
Server logs show:
`PrismaClientInitializationError: Can't reach database server at db.kaiimhojwfgefbkiwzkm.supabase.co:5432` or `Timed out fetching a new connection from the pool`.

### Root Cause
1. SSL mode missing from connection string.
2. Too many concurrent direct database connections exceeding PostgreSQL `max_connections`.

### Solution
1. Verify `?sslmode=require` is present at the end of `DATABASE_URL` and `DIRECT_URL`.
2. For high concurrency, use the Supabase Transaction Pooler URL (Supavisor, port 6543) for `DATABASE_URL`:
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```
   Keep `DIRECT_URL` pointing directly to port 5432 for migrations and schema operations.

---

## 3. Render Cold Starts & Initial Request Latency

### Symptom
First request to backend after 15+ minutes takes 20 to 50 seconds to respond.

### Root Cause
Free/Starter tier web services on Render automatically spin down after 15 minutes of inbound inactivity.

### Solution
1. Upgrade to Render `Starter` tier ($7/mo) with "Always On" enabled.
2. Or use a free monitoring service like [UptimeRobot](https://uptimerobot.com) to ping `https://messmate-backend.onrender.com/api/health` every 5 or 10 minutes to keep the container warm.

---

## 4. Vercel SPA 404 on Direct Route Refresh

### Symptom
Refreshing `https://baramati-messwala.vercel.app/customer` or navigating directly to a deep URL returns a standard `404: NOT_FOUND`.

### Root Cause
Vercel looks for a static file at `/customer/index.html` unless a rewrite rule redirects all non-asset paths to `/index.html`.

### Solution
MessMate includes `frontend/vercel.json` configured with:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Ensure you have set the **Root Directory** in Vercel project settings to `frontend` so Vercel detects this file.

---

## 5. API 404 Errors on Frontend Requests

### Symptom
Network tab shows calls to `https://messmate-backend.onrender.com/customers` returning 404.

### Root Cause
Missing `/api` prefix in `VITE_API_URL`.

### Solution
MessMate's `frontend/src/services/api.js` has built-in normalization that automatically appends `/api` if missing. Ensure `VITE_API_URL` is set in Vercel:
```env
VITE_API_URL=https://messmate-backend.onrender.com/api
```
After updating any `VITE_*` environment variable in Vercel, trigger a **Redeploy** so Vite embeds the new value during the build phase.

---

## 6. WhatsApp Notification Delivery Logging

### Symptom
WhatsApp messages are not delivered to customer mobile devices.

### Root Cause
`WHATSAPP_ENABLED` is set to `false` or Meta Cloud API credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) are unconfigured.

### Solution
MessMate features a resilient fallback: when `WHATSAPP_ENABLED=false`, notifications are automatically logged to the internal database (`Notification` model) and printed cleanly to server console logs. This ensures zero runtime exceptions for business flows even when Meta credentials are not configured.
