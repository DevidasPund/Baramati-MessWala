import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Public Components
import { Navbar } from './components/public/Navbar';
import { Footer } from './components/public/Footer';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { MenuPage } from './pages/public/MenuPage';
import { SubscriptionPlansPage as PublicPlansPage } from './pages/public/SubscriptionPlansPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';

// Common
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Admin
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { CustomerDetailsPage } from './pages/admin/CustomerDetailsPage';
import { CustomerVerificationPage } from './pages/admin/CustomerVerificationPage';
import { DabbaManagementPage } from './pages/admin/DabbaManagementPage';
import { PaymentManagementPage } from './pages/admin/PaymentManagementPage';
import { SubscriptionPlansPage as AdminPlansPage } from './pages/admin/SubscriptionPlansPage';
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage';
import { AttendancePage } from './pages/admin/AttendancePage';
import { AdminQrScannerPage } from './pages/admin/AdminQrScannerPage';
import { FoodMenuPage } from './pages/admin/FoodMenuPage';
import { ExtraMealsPage } from './pages/admin/ExtraMealsPage';
import { BillingInvoicesPage } from './pages/admin/BillingInvoicesPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { NotificationsPage } from './pages/admin/NotificationsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { FeedbackComplaintsPage } from './pages/admin/FeedbackComplaintsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Customer
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { CustomerQrCodePage } from './pages/customer/CustomerQrCodePage';
import { CustomerScanMessQrPage } from './pages/customer/CustomerScanMessQrPage';
import { CustomerAttendancePage } from './pages/customer/CustomerAttendancePage';
import { CustomerBillsPage } from './pages/customer/CustomerBillsPage';
import { CustomerExtraMealsPage } from './pages/customer/CustomerExtraMealsPage';
import { CustomerFeedbackPage } from './pages/customer/CustomerFeedbackPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { CustomerSubscriptionPage } from './pages/customer/CustomerSubscriptionPage';
import { CustomerMenuPage } from './pages/customer/CustomerMenuPage';
import { CustomerNotificationsPage } from './pages/customer/CustomerNotificationsPage';

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
    </>
  );
}

export default App;
