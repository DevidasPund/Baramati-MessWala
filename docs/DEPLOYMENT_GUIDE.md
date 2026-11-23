# MessMate – Production Deployment Guide

**Business**: Baramati Messwala (बारामती मेसवाला)  
**Hosting Provider**: Render (Static Site + Web Service)  
**Database**: Supabase PostgreSQL 17  

---

## 1. Production Architecture Overview

| Component | Service Type | Production URL | Render Service Name |
| :--- | :--- | :--- | :--- |
| **Frontend** | Static Site | `https://baramati-messwala-1.onrender.com` | `baramati-messwala-1` |
| **Backend** | Web Service | `https://baramati-messwala.onrender.com` | `messmate-backend` |
| **Database** | Managed PostgreSQL | `kaiimhojwfgefbkiwzkm.supabase.co:5432` | Supabase Cloud |

---

## 2. Backend Deployment (Render Web Service)

### 2.1 Service Specifications
- **Runtime**: Node
- **Region**: Singapore (`singapore`)
- **Plan**: Starter / Standard
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `node src/server.js`
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Enabled on Git push to `main`

### 2.2 Required Environment Variables
Configure the following in the Render Dashboard (**Environment** tab):

| Variable Key | Sample / Target Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5000` | Internal listening port |
| `DATABASE_URL` | `postgresql://postgres:[PWD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require` | Supabase connection string |
| `DIRECT_URL` | `postgresql://postgres:[PWD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require` | Direct connection for migrations |
| `JWT_SECRET` | *(64-character secret key)* | Signs customer & admin session tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiration period |
| `FRONTEND_URL` | `https://baramati-messwala-1.onrender.com` | Allowed CORS origin |
| `OWNER_PHONE` | `+919209184035` | Primary owner mobile number |
| `SECONDARY_OWNER_PHONE` | `+919822334455` | Secondary system admin mobile |
| `UPLOAD_DIR` | `uploads` | Local upload directory |
| `WHATSAPP_ENABLED` | `false` | Cloud API toggle (disable if token unconfigured) |

---

## 3. Frontend Deployment (Render Static Site)

### 3.1 Service Specifications
- **Runtime**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Auto-Deploy**: Enabled on Git push to `main`

### 3.2 Environment Variables
| Variable Key | Target Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://baramati-messwala.onrender.com/api` | Live production backend endpoint |

### 3.3 SPA Routing Configuration
Render requires client-side routing rewrites for React Router. Ensure `frontend/public/_redirects` exists:
```
/*    /index.html   200
```
This guarantees refreshing sub-routes like `/admin/dashboard` or `/customer/my-qr` never returns a 404.

---

## 4. Post-Deployment Verification Checklist

1. **Verify Backend Health**:
   ```bash
   curl -i https://baramati-messwala.onrender.com/api/health
   ```
   Must return HTTP 200 with `status: "healthy"` and database connected.
2. **Verify Frontend Loading**:
   ```bash
   curl -i https://baramati-messwala-1.onrender.com
   ```
   Must return HTTP 200 OK.
3. **Verify Owner Login**:
   Test login using Mobile `9209184035` and confirmed password on the live site.
4. **Verify Customer Login**:
   Test approved customer login and QR code generation.
