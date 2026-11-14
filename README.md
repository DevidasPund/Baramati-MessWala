# MessMate – Smart Mess & Tiffin Management System
### Modern Digital Management Platform for **Baramati Messwala**

> **Tagline:** Manage Your Mess, The Smart Way!  
> **Business:** Baramati Messwala  
> **Developer:** Devidas Pund  

---

## 🌟 Executive Summary

**MessMate** is a full-stack web application designed for **Baramati Messwala**, a prominent mess and tiffin service in Vidyanagari, Baramati, Maharashtra. The system eliminates paper registers, manual meal counting, subscription confusion, and payment discrepancies.

It provides four user interfaces:
1. **Public Website**: For visitors, showcasing food quality, hygiene standards, daily/weekly menus, subscription plans, and direct WhatsApp booking.
2. **Admin Dashboard**: For mess owners and managers, featuring 10 live KPI metrics, interactive analytics charts, customer lifecycle management, subscription controls, food menu planning, batch monthly billing, payment reconciliation, and audit logs.
3. **Customer Portal**: Mobile-first member portal where customers view their dynamic QR pass, scan counter QR codes, view menus, track bills, download PDF invoices, submit UPI payments, and request meal skips.
4. **Staff Terminal**: Restricted fast counter terminal for staff to scan member QR codes, verify active meal plans, and search customers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS (Emerald Green `#059669` & Dark Navy `#0f172a` Theme)
- **Routing**: React Router DOM (v6)
- **State & HTTP**: Context API + Axios with automated JWT injection & refresh
- **Data Visualization**: Recharts (Attendance trends, revenue charts, membership ratios)
- **QR Engine**: `qrcode.react` (SVG QR generation) + `html5-qrcode` (Live webcam/camera scanner)
- **Feedback**: React Hot Toast + Canvas Confetti

### Backend
- **Runtime**: Node.js & Express.js (ES Modules)
- **Database**: PostgreSQL (v17)
- **ORM**: Prisma ORM with relational schema & automated migrations
- **Security**: JWT tokens, bcrypt password hashing, role-based authorization middleware
- **File Uploads**: Multer with strict image MIME-type validation
- **Cron Engine**: Node Cron for automated expiry reminders and status updates
- **Integrations**:
  - **WhatsApp Business Cloud API**: Meta Graph API with mock notification fallback provider
  - **Excel Export**: SheetJS (`xlsx`) for instant `.xlsx` report downloads
  - **PDF Generation**: `pdfkit` for invoice statement generation

---

## 🔑 Default Seeded Accounts

For testing and demonstration, the database comes pre-seeded with the following credentials:

| Role | Email | Password | Code / Name |
|---|---|---|---|
| **Super Admin** | `admin@baramatimesswala.com` | `Admin@123` | Master Mess Administrator |
| **Staff Member** | `staff@baramatimesswala.com` | `Staff@123` | `STAFF-001` (Ramesh Shinde) |
| **Customer 1** | `customer@baramatimesswala.com` | `Customer@123` | `BMW-2026-001` (Amit Patil - Active) |
| **Customer 2** | `rohit@baramatimesswala.com` | `Customer@123` | `BMW-2026-002` (Rohit Deshmukh - Active) |
| **Customer 3** | `swapnil@baramatimesswala.com` | `Customer@123` | `BMW-2026-003` (Swapnil Jadhav - Paused) |

> ⚡ **Quick Login:** The login page (`/login`) includes 1-click demo buttons to automatically populate and test these accounts.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **PostgreSQL**: v14+ running on port 5432

### 2. Configure Backend
Navigate to the `backend` directory and configure environment variables in `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/messmate?schema=public"
JWT_SECRET="messmate_super_secret_jwt_key_baramati_messwala_2026"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
UPLOAD_DIR="uploads"

# WhatsApp Cloud API (Optional: blank values use Mock Notification Provider)
WHATSAPP_ENABLED=false
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_BUSINESS_ACCOUNT_ID=""
WHATSAPP_API_VERSION="v21.0"
```

### 3. Database Push & Seed
```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js
```

### 4. Start Backend Server
```bash
npm run dev
# Backend server runs on http://localhost:5000
```

### 5. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🧪 Automated End-to-End Acceptance Testing

Run the automated test suite verifying all 16 business acceptance criteria:
```bash
cd backend
node test-workflow.js
```

### Verified Test Cases:
1. ✅ Admin login and JWT generation.
2. ✅ Dynamic subscription plan creation.
3. ✅ Customer registration with unique ID (`BMW-YYYY-XXX`) and secure QR token.
4. ✅ Customer login and dashboard access.
5. ✅ Daily food menu retrieval.
6. ✅ QR attendance marking (Method B: Staff scans Customer QR).
7. ✅ Duplicate attendance prevention (Same meal & date blocked).
8. ✅ Extra meal and guest meal booking by customer with admin approval.
9. ✅ Automatic monthly billing calculation (`Subscription + Extra Meals - Discounts`).
10. ✅ Duplicate invoice prevention for same billing cycle.
11. ✅ Customer invoice viewing.
12. ✅ Customer UPI payment submission with transaction reference and proof.
13. ✅ Atomic payment verification by admin (reducing invoice balance).
14. ✅ Unverified payments do not prematurely reduce balance.
15. ✅ Notification dispatch (WhatsApp Cloud API / Mock Provider).
16. ✅ Analytics report aggregation and PDF invoice streaming.

---

## 📱 Dual-Method QR Attendance Architecture

### Method A: Customer Scans Mess QR (Self-Attendance)
1. Mess displays a live, refreshing QR code on a counter screen (`/admin/qr-scanner` → Display Mess QR).
2. The system generates short-lived session tokens (valid for 10 minutes) tagged with the current active meal.
3. Customers open `/customer/scan-mess` and scan the counter QR with their mobile camera.
4. Tokens expire automatically, preventing remote attendance fraud or shared screenshots.

### Method B: Staff Scans Customer Pass
1. Customer displays their permanent personal QR pass (`/customer/my-qr`).
2. Staff scans it via the staff terminal (`/staff/qr-scanner`).
3. System validates customer status, subscription period, meal allocation, and duplicate attendance rules in real-time.

---

## 📁 Project Structure

```
Baramati_MessWala/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models & enums
│   │   └── seed.js             # Initial database seeding
│   ├── src/
│   │   ├── config/             # DB & env configuration
│   │   ├── controllers/        # Express REST controllers
│   │   ├── integrations/       # WhatsApp Cloud API & Mock provider
│   │   ├── jobs/               # Node Cron schedulers
│   │   ├── middleware/         # Auth, RBAC, Multer, Error handler
│   │   ├── routes/             # Modular Express routers
│   │   ├── utils/              # PDF generator, Excel buffer, JWT
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── test-workflow.js        # Automated E2E test suite
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Common, Public, and Layout components
│   │   ├── context/            # AuthContext & session management
│   │   ├── layouts/            # AdminLayout, CustomerLayout, StaffLayout
│   │   ├── pages/
│   │   │   ├── admin/          # 12 Admin management modules
│   │   │   ├── customer/       # 8 Customer portal pages
│   │   │   ├── public/         # 8 Public landing & auth pages
│   │   │   └── staff/          # 4 Staff counter pages
│   │   ├── services/           # Axios client with interceptors
│   │   ├── App.jsx             # React Router routing tree
│   │   ├── main.jsx            # React root
│   │   └── index.css           # Tailwind CSS directives
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── api-documentation.md   # Complete REST API specification
│   └── deployment-guide.md    # Vercel & Render deployment guide
├── uploads/                    # Local storage for photos and receipts
└── README.md
```

---

## 👨‍💻 Developer & Business Credits
- **Business Name:** Baramati Messwala
- **Address:** Shop No. 4, College Corner, Vidyanagari, Baramati, Maharashtra 413133
- **Architect & Full-Stack Developer:** Devidas Pund
- **Application Name:** MessMate – Smart Mess & Tiffin Management System
