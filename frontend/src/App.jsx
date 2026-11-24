import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts & Guards (Eager for instant shell paint)
import { Navbar } from './components/public/Navbar';
import { Footer } from './components/public/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';

// Public Pages (Lazy)
const HomePage = lazy(() => import('./pages/public/HomePage').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })));
const MenuPage = lazy(() => import('./pages/public/MenuPage').then((m) => ({ default: m.MenuPage })));
const PublicPlansPage = lazy(() => import('./pages/public/SubscriptionPlansPage').then((m) => ({ default: m.SubscriptionPlansPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));

// Admin Pages (Lazy - Heavy analytics, tables & scanners loaded on demand)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const CustomerDetailsPage = lazy(() => import('./pages/admin/CustomerDetailsPage').then((m) => ({ default: m.CustomerDetailsPage })));
const CustomerVerificationPage = lazy(() => import('./pages/admin/CustomerVerificationPage').then((m) => ({ default: m.CustomerVerificationPage })));
const DabbaManagementPage = lazy(() => import('./pages/admin/DabbaManagementPage').then((m) => ({ default: m.DabbaManagementPage })));
const PaymentManagementPage = lazy(() => import('./pages/admin/PaymentManagementPage').then((m) => ({ default: m.PaymentManagementPage })));
const AdminPlansPage = lazy(() => import('./pages/admin/SubscriptionPlansPage').then((m) => ({ default: m.SubscriptionPlansPage })));
const SubscriptionsPage = lazy(() => import('./pages/admin/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })));
const AttendancePage = lazy(() => import('./pages/admin/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const AdminQrScannerPage = lazy(() => import('./pages/admin/AdminQrScannerPage').then((m) => ({ default: m.AdminQrScannerPage })));
const FoodMenuPage = lazy(() => import('./pages/admin/FoodMenuPage').then((m) => ({ default: m.FoodMenuPage })));
const ExtraMealsPage = lazy(() => import('./pages/admin/ExtraMealsPage').then((m) => ({ default: m.ExtraMealsPage })));
const BillingInvoicesPage = lazy(() => import('./pages/admin/BillingInvoicesPage').then((m) => ({ default: m.BillingInvoicesPage })));
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const FeedbackComplaintsPage = lazy(() => import('./pages/admin/FeedbackComplaintsPage').then((m) => ({ default: m.FeedbackComplaintsPage })));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// Customer Pages (Lazy - Fast, lightweight bundle on budget Android phones)
const CustomerDashboardPage = lazy(() => import('./pages/customer/CustomerDashboardPage').then((m) => ({ default: m.CustomerDashboardPage })));
const CustomerQrCodePage = lazy(() => import('./pages/customer/CustomerQrCodePage').then((m) => ({ default: m.CustomerQrCodePage })));
const CustomerScanMessQrPage = lazy(() => import('./pages/customer/CustomerScanMessQrPage').then((m) => ({ default: m.CustomerScanMessQrPage })));
const CustomerAttendancePage = lazy(() => import('./pages/customer/CustomerAttendancePage').then((m) => ({ default: m.CustomerAttendancePage })));
const CustomerBillsPage = lazy(() => import('./pages/customer/CustomerBillsPage').then((m) => ({ default: m.CustomerBillsPage })));
const CustomerExtraMealsPage = lazy(() => import('./pages/customer/CustomerExtraMealsPage').then((m) => ({ default: m.CustomerExtraMealsPage })));
const CustomerFeedbackPage = lazy(() => import('./pages/customer/CustomerFeedbackPage').then((m) => ({ default: m.CustomerFeedbackPage })));
const CustomerProfilePage = lazy(() => import('./pages/customer/CustomerProfilePage').then((m) => ({ default: m.CustomerProfilePage })));
const CustomerSubscriptionPage = lazy(() => import('./pages/customer/CustomerSubscriptionPage').then((m) => ({ default: m.CustomerSubscriptionPage })));
const CustomerMenuPage = lazy(() => import('./pages/customer/CustomerMenuPage').then((m) => ({ default: m.CustomerMenuPage })));
const CustomerNotificationsPage = lazy(() => import('./pages/customer/CustomerNotificationsPage').then((m) => ({ default: m.CustomerNotificationsPage })));

// Lightweight Loading Fallback Spinner
const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
    <div className="w-8 h-8 border-3 border-[#205D48] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-bold text-stone-500">माहिती लोड होत आहे...</span>
  </div>
);

// Layout wrapper for public website with Navbar & Footer
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Public Website */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/menu" element={<PublicLayout><MenuPage /></PublicLayout>} />
          <Route path="/plans" element={<PublicLayout><PublicPlansPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailsPage />} />
            <Route path="customer-verification" element={<CustomerVerificationPage />} />
            <Route path="dabba-management" element={<DabbaManagementPage />} />
            <Route path="payment-management" element={<PaymentManagementPage />} />
            <Route path="plans" element={<AdminPlansPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="qr-scanner" element={<AdminQrScannerPage />} />
            <Route path="menu" element={<FoodMenuPage />} />
            <Route path="extra-meals" element={<ExtraMealsPage />} />
            <Route path="billing" element={<BillingInvoicesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="feedback" element={<FeedbackComplaintsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Customer Portal */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN', 'ADMIN']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboardPage />} />
            <Route path="my-qr" element={<CustomerQrCodePage />} />
            <Route path="scan-mess" element={<CustomerScanMessQrPage />} />
            <Route path="attendance" element={<CustomerAttendancePage />} />
            <Route path="bills" element={<CustomerBillsPage />} />
            <Route path="extra-meals" element={<CustomerExtraMealsPage />} />
            <Route path="subscription" element={<CustomerSubscriptionPage />} />
            <Route path="menu" element={<CustomerMenuPage />} />
            <Route path="notifications" element={<CustomerNotificationsPage />} />
            <Route path="feedback" element={<CustomerFeedbackPage />} />
            <Route path="profile" element={<CustomerProfilePage />} />
          </Route>

          {/* Redirect any legacy staff paths */}
          <Route path="/staff/*" element={<Navigate to="/login" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
