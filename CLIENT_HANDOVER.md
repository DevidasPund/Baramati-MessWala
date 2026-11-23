# MessMate – Final Client Handover Document

**Project**: MessMate – Smart Mess & Tiffin Management System  
**Client / Business**: Baramati Messwala (बारामती मेसवाला)  
**Developer**: Devidas Pund  
**Handover Date**: November 24, 2026  
**Repository**: [DevidasPund/Baramati-MessWala](https://github.com/DevidasPund/Baramati-MessWala)  

---

## 1. Production Access URLs

| Application | Production URL | Notes |
| :--- | :--- | :--- |
| **Public Website & Customer Portal** | `https://baramati-messwala-1.onrender.com` | PWA enabled, installable on mobile |
| **Owner / Admin Login Portal** | `https://baramati-messwala-1.onrender.com/login` | Direct login for mess owner |
| **Backend REST API** | `https://baramati-messwala.onrender.com` | Node.js + Express backend service |
| **System Health Check** | `https://baramati-messwala.onrender.com/api/health` | Live database connectivity & uptime check |
| **Database Management Console** | `https://supabase.com/dashboard/project/kaiimhojwfgefbkiwzkm` | Managed PostgreSQL 17 database |

---

## 2. Owner / Admin Credentials & Access Instructions

- **Registered Owner Login Identifiers**:
  - Business Mobile: `9209184035`
  - Secondary Mobile: `9822334455`
  - Registered Email: `admin@baramatimesswala.com`
- **Owner Role**: `SUPER_ADMIN`
- **Password**: Provided via secure out-of-band channel (never committed to repository).
- **Navigation Sections**:
  1. **डॅशबोर्ड**: Comprehensive KPI statistics, daily attendance charts, revenue comparison, and action alerts.
  2. **ग्राहक**: Customer directory, registration approvals, account suspension, and plan linking.
  3. **हजेरी (QR)**: Dual-mode scanner supporting both customer pass scanning and counter dynamic screen display.
  4. **बिलिंग / पेमेंट**: Monthly invoice generation, outstanding balance tracking, and UPI/Cash payment confirmation.
  5. **आजचा मेनू**: Lunch and dinner daily menu management.
  6. **खर्च व किराणा**: Expense logging and grocery purchase accounting.
  7. **अहवाल**: Daily attendance logs, monthly billing summaries, and Excel export.
  8. **सेटिंग**: Meal timings, business contact info, and UPI payment details.

---

## 3. Customer Lifecycle & Daily Operations

1. **Registration**: New customer signs up at `/register`. Default status is `PENDING_APPROVAL`.
2. **Initial Password**: Customer's 10-digit mobile number serves as their temporary starting password.
3. **Owner Approval**: Owner verifies customer details at `/admin/customer-verification` and clicks **मंजूर करा (Approve)**.
4. **First Login**: Customer logs in at `/login` and is prompted to create a secure personal password ($\ge 6$ characters, not equal to their mobile number).
5. **Dining Pass (QR)**: Customer opens `/customer/my-qr` and presents their personal QR code at the mess counter.
6. **Billing & Settlement**:
   - Monthly invoice is issued.
   - Customer submits payment via UPI or cash.
   - Owner confirms payment in the portal. Status transitions to `PAID`.

---

## 4. Mobile Installation for Android (PWA)

1. Open **Google Chrome** on the mobile phone.
2. Visit `https://baramati-messwala-1.onrender.com`.
3. Tap the **3-dot menu (⋮)** in Chrome and select **"Install app"** (or **"Add to Home screen"**).
4. Confirm installation. The **बारामती मेसवाला** app icon will appear directly on the home screen.
5. Launch the app for a fullscreen mobile app experience.

---

## 5. Hosting & Infrastructure Ownership

- **Frontend Hosting**: Render Static Site (Connected to GitHub `main` branch with automatic deployment).
- **Backend Hosting**: Render Web Service (Node.js environment).
- **Database**: Supabase PostgreSQL 17 (Automated continuous snapshots enabled).
- **Domain Configuration**: Custom domains (e.g. `baramatimesswala.com`) can be attached at any time in Render without codebase modifications.

---

## 6. Client Handover Checklist

- [x] Full-Stack codebase audited and verified.
- [x] Owner login verified via mobile number (`9209184035`) and email.
- [x] Customer QR attendance bug resolved; tested with approved and active accounts.
- [x] Staff role access blocked with HTTP 403 per business requirements.
- [x] First-time customer login password change enforced.
- [x] Admin dashboard upgraded with live Recharts analytics and zero dummy data.
- [x] Mobile responsiveness verified across 320px, 360px, 375px, 390px, 414px, and 430px.
- [x] Android QR scanner optimized with rear-camera default and torch toggle.
- [x] All 10 automated mobile-first integration tests executed with 100% pass rate.
- [x] Production backend health check returning 200 OK with connected Supabase database.
- [x] Production frontend serving live assets at 200 OK.
- [x] 12 comprehensive markdown documentation guides created.
- [x] Git commits synchronized with remote GitHub repository.
