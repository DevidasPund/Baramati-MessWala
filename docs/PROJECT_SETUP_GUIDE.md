# MessMate – Project Setup & Local Development Guide

This guide describes how to set up, configure, and run the MessMate application locally for development, testing, and deployment.

---

## 1. Prerequisites

- **Node.js**: Version 20.x or higher (LTS recommended).
- **npm**: Version 10.x or higher.
- **Git**: Installed and configured.
- **Supabase Account**: Access to PostgreSQL database connection strings.

---

## 2. Repository Cloning

```bash
git clone https://github.com/DevidasPund/Baramati-MessWala.git
cd Baramati_MessWala
```

---

## 3. Backend Setup

### 3.1 Install Dependencies
```bash
cd backend
npm install
```

### 3.2 Environment Variables
Create a `.env` file in the `backend/` folder based on `.env.example`:

```env
PORT=5000
NODE_ENV=development

# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require&connect_timeout=30&pool_timeout=30"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.kaiimhojwfgefbkiwzkm.supabase.co:5432/postgres?sslmode=require&connect_timeout=30&pool_timeout=30"

# Supabase Storage & Project
SUPABASE_URL="https://kaiimhojwfgefbkiwzkm.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Authentication
JWT_SECRET="your-secure-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:5173"

# Uploads directory
UPLOAD_DIR="uploads"

# Owner Phone Numbers
OWNER_PHONE="+919209184035"
SECONDARY_OWNER_PHONE="+919822334455"
```

### 3.3 Prisma Client Generation
```bash
npx prisma generate
```

### 3.4 Start Backend Server
```bash
# Development mode
npm run dev

# Or standard start
npm start
```
The backend API will start on `http://localhost:5000`. You can verify health via:
`http://localhost:5000/api/health`

---

## 4. Frontend Setup

### 4.1 Install Dependencies
```bash
cd ../frontend
npm install
```

### 4.2 Environment Variables
Create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL="http://localhost:5000/api"
```

### 4.3 Run Frontend Development Server
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`.

### 4.4 Build for Production
```bash
npm run build
```
Compiled static assets are placed in `frontend/dist/`.

---

## 5. Running Automated Health & Integration Tests

From the `backend/` directory:

```bash
# Test Supabase connection
npm run test:db

# Run full role-enforcement and integration suite
node test-mobile-first-system.js
```
