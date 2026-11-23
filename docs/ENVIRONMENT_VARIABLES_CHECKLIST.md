# MessMate – Environment Variables Checklist

This checklist verifies all environment configuration variables across Development, Staging, and Production deployments.

---

## 1. Backend Service (`backend/.env` & Render Web Service)

| Variable | Required in Prod? | Current Prod Status | Sensitivity | Purpose |
| :--- | :---: | :---: | :---: | :--- |
| `NODE_ENV` | Yes | `production` | Low | Enables Express production optimizations & error suppression |
| `PORT` | Yes | `5000` | Low | Port for internal server binding |
| `DATABASE_URL` | Yes | Configured | **HIGH (Secret)** | Supabase PostgreSQL connection with pooling |
| `DIRECT_URL` | Yes | Configured | **HIGH (Secret)** | Direct PostgreSQL connection for DDL / schema operations |
| `JWT_SECRET` | Yes | Configured | **HIGH (Secret)** | Cryptographic salt for signing authentication tokens |
| `JWT_EXPIRES_IN` | Yes | `7d` | Low | Session token validity duration |
| `FRONTEND_URL` | Yes | Configured | Low | Allowed CORS origin for frontend API requests |
| `OWNER_PHONE` | Yes | `+919209184035` | Medium | Primary business mobile for Owner login mapping |
| `SECONDARY_OWNER_PHONE` | Optional | `+919822334455` | Medium | Fallback secondary owner mobile |
| `SUPABASE_URL` | Yes | Configured | Low | Base URL for Supabase API and storage buckets |
| `SUPABASE_ANON_KEY` | Optional | Configured | Medium | Supabase anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Unset | **HIGH (Secret)** | Supabase service role for server-side storage bypass |
| `UPLOAD_DIR` | Yes | `uploads` | Low | Path for storing uploaded files and payment receipts |
| `WHATSAPP_ENABLED` | Yes | `false` | Low | Disables Meta Cloud API calls when credentials are unconfigured |
| `WHATSAPP_ACCESS_TOKEN` | If enabled | Optional | **HIGH (Secret)** | Meta Cloud API permanent system user token |
| `WHATSAPP_PHONE_NUMBER_ID` | If enabled | Optional | Medium | Meta verified phone ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | If enabled | Optional | Medium | Meta WABA ID |

---

## 2. Frontend Application (`frontend/.env` & Render Static Site)

| Variable | Required in Prod? | Target Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `https://baramati-messwala.onrender.com/api` | Absolute production backend API base URL |

> [!IMPORTANT]
> Never include `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or `JWT_SECRET` in any `VITE_*` variable, as all `VITE_*` variables are embedded into client-side JavaScript bundles.
