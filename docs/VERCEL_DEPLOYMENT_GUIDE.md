# MESSMATE – VERCEL PRODUCTION DEPLOYMENT GUIDE

**Application Name:** MessMate – Smart Mess & Tiffin Management System  
**Business Name:** Baramati Messwala  
**Developer:** Devidas Pund  
**Deployment Target:** Vercel (Frontend & Serverless API)  

---

## 1. Prerequisites
1. A [Vercel](https://vercel.com/) account.
2. The GitHub repository holding your MessMate project code.

---

## 2. Option A: Monorepo Single-Project Vercel Deployment (Recommended)
This deploys both the React + Vite frontend and the Node.js Express serverless functions under a single unified domain without CORS complications.

1. In the Vercel Dashboard, click **Add New... > Project**.
2. Select and import your GitHub repository: `Baramati_MessWala`.
3. Leave **Root Directory** as `./` (Root).
4. Vercel automatically detects `vercel.json` in the root:
   - Frontend build output: `frontend/dist`
   - Serverless API handler: `api/index.js`
5. Click **Environment Variables** and add the required production keys:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `messmate_production_jwt_sec_7585_baramati_messwala_dp_2026`
   - `DATABASE_URL`: `postgresql://postgres:...`
   - `DIRECT_URL`: `postgresql://postgres:...`
   - `FRONTEND_URL`: `https://<your-project>.vercel.app`
   - `WHATSAPP_ENABLED`: `false` (or `true` if Meta credentials provided)
6. Click **Deploy**.

---

## 3. Option B: Separate Frontend & Backend Deployment
If you host the backend API on Render or Railway (ideal for 24/7 background cron jobs like automated midnight invoice generation) and frontend on Vercel:

### Frontend on Vercel:
1. In Vercel, select **Root Directory** as `frontend`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Environment Variables:
   - `VITE_API_URL`: `https://<your-backend-service>.onrender.com/api`
   - `VITE_APP_NAME`: `MessMate`
   - `VITE_BUSINESS_NAME`: `Baramati Messwala`
6. Click **Deploy**.

### Backend on Render / Railway:
1. Connect repository with Root Directory: `backend`.
2. Build Command: `npm install && npx prisma generate`.
3. Start Command: `npm start`.
4. Render automatically detects `render.yaml` or `backend/Procfile`.

---

## 4. SPA Rewrites & Routing Verification
When deploying to Vercel, client-side routes (e.g. `/admin/dashboard`, `/customer/attendance`, `/about`) require SPA URL rewriting to prevent 404 errors on browser page reload.

This is automatically pre-configured in both `vercel.json` (root) and `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. Post-Deployment Verification Checklist
1. Visit the production URL: `https://<your-project>.vercel.app/`
2. Open DevTools Console: Ensure zero CORS or asset loading errors.
3. Test Public Navigation: `/`, `/menu`, `/plans`, `/about`, `/contact`.
4. Test Admin Login: Sign in with `admin@baramatimesswala.com` / `Baramati@Admin2026#`.
5. Test Customer Login: Sign in with `customer@baramatimesswala.com` / `Customer@123`.
6. Verify Dashboard Metrics: Confirm cards and charts display real numbers from the database.
7. Test UPI Payment: Open bill payment modal and confirm verified payee badge **Baramaticha Dabewala**.
