# MESSMATE – ENVIRONMENT VARIABLES CONFIGURATION TEMPLATE

**Application:** MessMate – Smart Mess & Tiffin Management System  
**Business:** Baramati Messwala  
**Developer:** Devidas Pund  

> **SECURITY NOTICE:** Never commit actual `.env` files containing production passwords, API tokens, or private keys to public Git repositories. Use this template to configure your deployment environment on Vercel, Render, or Railway.

---

## 1. Backend Environment Variables (`backend/.env`)

```env
# ==============================================================================
# SERVER & APPLICATION RUNTIME
# ==============================================================================
PORT=5000
NODE_ENV=production

# ==============================================================================
# DATABASE CONNECTION (POSTGRESQL / SUPABASE)
# ==============================================================================
# Pooled Connection URL (Port 5432 or 6543)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"

# Direct Non-Pooled Connection URL (Used by Prisma for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"

# ==============================================================================
# JWT AUTHENTICATION
# ==============================================================================
# Cryptographic secret for signing JSON Web Tokens (min 32 characters)
JWT_SECRET="your_long_random_cryptographic_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"

# ==============================================================================
# FRONTEND CORS ALLOWLIST
# ==============================================================================
FRONTEND_URL="https://your-messmate-domain.vercel.app"

# ==============================================================================
# LOCAL FILE STORAGE FALLBACK
# ==============================================================================
UPLOAD_DIR="uploads"

# ==============================================================================
# SUPABASE STORAGE (OPTIONAL IF USING LOCAL STORAGE OR FIREBASE)
# ==============================================================================
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# ==============================================================================
# FIREBASE ADMIN SDK (FOR CLOUD FIRESTORE & FIREBASE AUTH)
# ==============================================================================
FIREBASE_PROJECT_ID="messmate-baramati"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@messmate-baramati.iam.gserviceaccount.com"
# Note: Escape newlines as \\n in cloud environments like Vercel/Render
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\\n-----END PRIVATE KEY-----\\n"
FIREBASE_STORAGE_BUCKET="messmate-baramati.appspot.com"
FIREBASE_DATABASE_URL="https://messmate-baramati.firebaseio.com"

# ==============================================================================
# WHATSAPP BUSINESS CLOUD API (META DEVELOPERS)
# ==============================================================================
WHATSAPP_ENABLED=false
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_BUSINESS_ACCOUNT_ID=""
WHATSAPP_API_VERSION="v21.0"
```

---

## 2. Frontend Environment Variables (`frontend/.env`)

```env
# ==============================================================================
# REST API ENDPOINT
# ==============================================================================
# For local development: "/api" (proxied by Vite)
# For production cross-domain: "https://your-backend-service.onrender.com/api"
VITE_API_URL="/api"

# ==============================================================================
# BRANDING
# ==============================================================================
VITE_APP_NAME="MessMate"
VITE_BUSINESS_NAME="Baramati Messwala"

# ==============================================================================
# FIREBASE WEB CLIENT SDK (FOR REAL-TIME FIRESTORE LISTENERS)
# ==============================================================================
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN="messmate-baramati.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="messmate-baramati"
VITE_FIREBASE_STORAGE_BUCKET="messmate-baramati.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
```
