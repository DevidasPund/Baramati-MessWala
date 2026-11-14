# MessMate Production Deployment Guide
**Baramati Messwala – Smart Mess & Tiffin Management System**  
*Lead Architect & Full-Stack DevOps Engineer: Devidas Pund*

---

## 1. System Architecture Overview

MessMate is built as a robust, decoupled multi-tier web application designed for high uptime, data integrity, and low operating costs:

```
                  ┌─────────────────────────────────────────┐
                  │          Vercel Edge Network            │
                  │   MessMate Frontend SPA (React + Vite)   │
                  │    Custom Domain: baramatimesswala.com  │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS REST Calls
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            Render Cloud                 │
                  │   Node.js / Express Web Service         │
                  │   URL: messmate-backend.onrender.com    │
                  │   Health Check: /api/health             │
                  └─────────────┬───────────────────────────┘
                                │ Prisma 6 Connection Pooler
                                ▼
                  ┌─────────────────────────────────────────┐
                  │          Supabase PostgreSQL            │
                  │   Database: db.kaiimhojwfgefbkiwzkm     │
                  │   Storage: Customer Photos & UPI Proofs │
                  └─────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Noto Sans Devanagari (Marathi UI). Hosted on **Vercel**.
- **Backend**: Node.js 20+, Express.js, Prisma ORM 6, JWT, Helmet, CORS, Rate Limiting. Hosted on **Render**.
- **Database**: Supabase PostgreSQL (Tokyo `ap-northeast-1` / Singapore), connection pooling via Supabase Supavisor.
- **Storage**: Supabase Storage for customer avatars, QR codes, and payment receipts.
- **Notifications**: WhatsApp Business Cloud API with automatic mock logger fallback.

---

## 2. Prerequisites & Accounts

Before beginning deployment, ensure you have:
1. **GitHub Repository**: [https://github.com/DevidasPund/Baramati-MessWala](https://github.com/DevidasPund/Baramati-MessWala)
2. **Render Account**: [https://dashboard.render.com](https://dashboard.render.com)
3. **Vercel Account**: [https://vercel.com](https://vercel.com)
4. **Supabase Project**: `messmate-production` (`kaiimhojwfgefbkiwzkm`)

---

## 3. Backend Deployment – Render

### Option A: Automatic Blueprint Deployment (Recommended)
The repository includes a ready-to-use `render.yaml` infrastructure specification.

1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **Blueprints** in the top navigation -> Click **New Blueprint Instance**.
3. Connect the repository `DevidasPund/Baramati-MessWala`.
4. Render detects `render.yaml` automatically and configures the `messmate-backend` web service.
5. In the blueprint variables page, fill in the secret variables marked `sync: false`:
   - `DATABASE_URL`: Supabase pooler URL with `?sslmode=require`
   - `DIRECT_URL`: Supabase direct connection URL
   - `SUPABASE_ANON_KEY`: Supabase project anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
   - `FRONTEND_URL`: `https://baramatimesswala.com,https://<your-vercel-subdomain>.vercel.app`
6. Click **Apply**. Render will clone, build, run `npx prisma generate`, and launch the server.

---

### Option B: Manual Web Service Setup
If configuring manually via the Render dashboard:

1. Click **New +** -> **Web Service**.
2. Connect your repository: `https://github.com/DevidasPund/Baramati-MessWala`.
3. Fill in the service parameters:
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `messmate-backend` |
   | **Language / Environment** | `Node` |
   | **Region** | `Singapore` (closest to users in India) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Build Command** | `npm install && npx prisma generate` |
   | **Start Command** | `node src/server.js` |
   | **Instance Type** | `Starter` (or `Free` for testing) |
   | **Health Check Path** | `/api/health` |
   | **Auto-Deploy** | `Yes` |

4. In the **Environment Variables** section, add the required keys:
   | Variable Key | Sample / Production Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `5000` | Render maps port dynamically |
   | `DATABASE_URL` | `postgresql://postgres:[PWD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require` | Supabase pooler / db connection |
   | `DIRECT_URL` | `postgresql://postgres:[PWD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require` | Direct connection for Prisma |
   | `JWT_SECRET` | 64-character random hex string | Use Render "Generate" button |
   | `JWT_EXPIRES_IN` | `7d` | Token lifetime |
   | `FRONTEND_URL` | `https://baramatimesswala.com,https://messmate.vercel.app` | Allowed CORS origins |
   | `SUPABASE_URL` | `https://kaiimhojwfgefbkiwzkm.supabase.co` | Supabase endpoint |
   | `SUPABASE_ANON_KEY` | `ey...` | Public anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `ey...` | Backend service key |
   | `UPLOAD_DIR` | `uploads` | Directory for temp files |
   | `WHATSAPP_ENABLED` | `false` | Set `true` when Meta credentials active |
   | `WHATSAPP_API_VERSION` | `v21.0` | Meta Graph API version |

5. Click **Create Web Service**.
6. When deployment finishes, note your public backend URL:
   `https://messmate-backend.onrender.com`

---

## 4. Frontend Deployment – Vercel

### Step-by-Step Vercel Setup

1. Log in to [Vercel](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import the GitHub repository: `DevidasPund/Baramati-MessWala`.
4. In the **Configure Project** screen:
   - **Project Name**: `baramati-messwala` (or `messmate-frontend`)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend` (CRITICAL STEP).
5. **Build and Output Settings** (automatically detected from `frontend/vercel.json`):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. **Environment Variables**:
   Add the following variables:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://messmate-backend.onrender.com/api` | Point to your deployed Render backend |
   | `VITE_APP_NAME` | `MessMate` | Branding title |
   | `VITE_BUSINESS_NAME` | `Baramati Messwala` | Mess branding |

   > [!IMPORTANT]
   > Ensure `VITE_API_URL` points to your Render backend with `/api`. MessMate frontend automatically normalizes the URL even if entered without `/api`, but best practice is providing the full path.

7. Click **Deploy**.
8. Once deployment finishes, Vercel provides your live domain (e.g., `https://baramati-messwala.vercel.app`).
9. Update `FRONTEND_URL` on Render to include your newly assigned Vercel URL to allow CORS.

---

## 5. Custom Domain Configuration (Optional)

To connect `baramatimesswala.com`:
1. In Vercel -> Project Settings -> **Domains** -> Add `baramatimesswala.com` and `www.baramatimesswala.com`.
2. Configure DNS A and CNAME records at your registrar:
   - `A` record `@` -> `76.76.21.21`
   - `CNAME` `www` -> `cname.vercel-dns.com`
3. In Render backend settings, ensure `FRONTEND_URL` includes `https://baramatimesswala.com`.

---

## 6. Post-Deployment Verification Checklist

Verify all features after initial deployment:

- [ ] **Health Check**: Visit `https://messmate-backend.onrender.com/api/health` and verify `status: "healthy"` and database `connected`.
- [ ] **Admin Login**: Access `/login`, sign in with `admin@baramatimesswala.com`, verify Marathi Admin Dashboard loads with real KPIs.
- [ ] **Customer Login**: Sign in with customer credentials or phone number, verify Marathi Customer Dashboard loads with meal status and QR card.
- [ ] **Staff Counter**: Sign in with staff credentials, verify QR scanner operates.
- [ ] **Attendance Recording**: Verify duplicate attendance is blocked for the same meal window.
- [ ] **UPI Payment Flow**: Test mock or live UPI payment submission and verify admin approval flow.
