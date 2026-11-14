# MessMate API Documentation
**Baramati Messwala – Smart Mess & Tiffin Management System**
*Architected & Developed by Devidas Pund*

---

## Base URL
```
Development: http://localhost:5000/api
Production:  https://your-backend-domain.com/api
```

## Authentication
JWT Bearer token required in `Authorization` header:
```
Authorization: Bearer <TOKEN>
```

---

## 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login with email and password (Admin, Staff, Customer) |
| POST | `/api/auth/register-customer` | Public | Customer self-registration with initial plan selection |
| POST | `/api/auth/forgot-password` | Public | Request password reset token |
| POST | `/api/auth/reset-password` | Public | Reset password using valid token |
| GET  | `/api/auth/me` | Authenticated | Retrieve current user profile and role details |
| PUT  | `/api/auth/update-profile` | Authenticated | Update user/customer name, phone, address |

---

## 2. Admin Management (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard-stats` | Admin | 10 KPI counts, attendance trends, revenue charts, activity logs |

---

## 3. Customer Management (`/api/customers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/customers` | Staff/Admin | List customers with search, status filters, and pagination |
| POST | `/api/customers` | Admin | Create customer with unique ID, QR token, and optional plan |
| GET | `/api/customers/:id` | Owner/Admin | Get customer profile, active plan, QR code, attendance, invoices |
| PUT | `/api/customers/:id` | Admin | Update customer details or status |
| DELETE | `/api/customers/:id` | Admin | Cascading delete customer and related records |
| POST | `/api/customers/:id/regenerate-qr` | Admin | Regenerate secure QR token |

---

## 4. Attendance System (`/api/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/attendance/mess-qr-session` | Authenticated | Get dynamic short-lived session QR token (Method A) |
| POST | `/api/attendance/scan-mess-qr` | Customer | Customer scans mess dynamic QR token to self-mark attendance |
| POST | `/api/attendance/scan-customer-qr` | Staff/Admin | Staff scans customer personal QR token (Method B) |
| GET | `/api/attendance` | Staff/Admin | List attendance records by date, meal type, customer |
| POST | `/api/attendance/manual` | Admin | Manually record attendance correction |
| DELETE | `/api/attendance/:id` | Admin | Delete attendance record with audit trail |
| GET | `/api/attendance/export/excel` | Staff/Admin | Download formatted Excel attendance spreadsheet |

---

## 5. Subscriptions (`/api/subscriptions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/subscriptions/plans` | Public | List available subscription plans and included meals |
| POST | `/api/subscriptions/plans` | Admin | Create new plan (code, duration, price, included meals) |
| PUT | `/api/subscriptions/plans/:id` | Admin | Update plan details or toggle active |
| DELETE | `/api/subscriptions/plans/:id` | Admin | Delete unused plan |
| GET | `/api/subscriptions` | Staff/Admin | List customer subscriptions (active, paused, expired) |
| POST | `/api/subscriptions/assign` | Admin | Assign subscription plan to member and issue invoice |
| PUT | `/api/subscriptions/:id/pause` | Admin | Pause subscription |
| PUT | `/api/subscriptions/:id/resume` | Admin | Resume subscription and extend end date by paused days |
| POST | `/api/subscriptions/:id/renew` | Admin | Renew subscription for next period |

---

## 6. Daily Food Menu (`/api/menu`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/menu/today` | Public | Get today's published breakfast, lunch, and dinner menus |
| GET | `/api/menu/weekly` | Public | Get 7-day upcoming weekly menu rotation |
| GET | `/api/menu` | Staff/Admin | Admin filter menu records by date and category |
| POST | `/api/menu` | Admin | Create/Update food menu with dishes, description, special feast flag |
| DELETE | `/api/menu/:id` | Admin | Delete menu item |
| POST | `/api/menu/:id/broadcast` | Admin | Broadcast WhatsApp announcement for today's menu to members |

---

## 7. Extra Meals & Requests (`/api/extra-meals`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/extra-meals/book` | Customer/Admin | Book extra breakfast/lunch/dinner or guest meal |
| GET | `/api/extra-meals` | Authenticated | List extra meal requests |
| PUT | `/api/extra-meals/:id/status` | Admin | Approve or reject extra meal (approved meals added to invoice) |
| POST | `/api/extra-meals/requests` | Customer | Request meal skip or subscription pause |
| GET | `/api/extra-meals/requests` | Authenticated | List meal skip and leave requests |
| PUT | `/api/extra-meals/requests/:id/status` | Admin | Approve or reject meal skip / pause request |

---

## 8. Invoices & Billing Engine (`/api/invoices`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/invoices/generate` | Admin | Batch execute monthly billing cycle (subscription + extra meals) |
| GET | `/api/invoices` | Authenticated | List invoices with status (PENDING, PAID, PARTIALLY_PAID, OVERDUE) |
| GET | `/api/invoices/:id` | Owner/Admin | Get invoice line items, amounts, and payments |
| GET | `/api/invoices/:id/pdf` | Owner/Admin | Download official PDF invoice statement |

---

## 9. Payments (`/api/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/payments` | Authenticated | List payments (UPI, Cash) with verification status |
| POST | `/api/payments` | Authenticated | Customer submits UPI transaction reference and screenshot |
| PUT | `/api/payments/:id/verify` | Admin | Admin verifies UPI/cash payment, atomically reducing balance |

---

## 10. Staff Management (`/api/staff`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/staff` | Admin | List staff members and role permissions |
| POST | `/api/staff` | Admin | Add staff member with permissions (`scan_attendance`, etc.) |
| PUT | `/api/staff/:id` | Admin | Update staff details or toggle active |
| GET | `/api/staff/dashboard` | Staff/Admin | Counter terminal metrics (today scans, meal counts, active members) |

---

## 11. Reports & Analytics (`/api/reports`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reports/analytics` | Admin | Aggregate metrics for date range (revenue, attendance, extra meals) |
| GET | `/api/reports/export/excel` | Admin | Download filtered Excel (.xlsx) file (attendance, revenue, customers) |

---

## 12. Feedback & Complaints (`/api/feedback`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/feedback/feedback` | Customer | Submit 1-5 star ratings for food taste and hygiene |
| GET | `/api/feedback/feedback` | Admin | Review ratings and satisfaction average |
| POST | `/api/feedback/complaints` | Customer | Register complaint with category |
| GET | `/api/feedback/complaints` | Authenticated | List complaints |
| PUT | `/api/feedback/complaints/:id/resolve` | Admin | Respond to complaint and update status to RESOLVED |

---

## 13. Settings (`/api/settings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/settings/public` | Public | Retrieve public business details, timings, and contact |
| GET | `/api/settings` | Admin | Retrieve complete settings including WhatsApp Cloud API config |
| PUT | `/api/settings` | Admin | Update business settings, meal timings, UPI ID, and API keys |
