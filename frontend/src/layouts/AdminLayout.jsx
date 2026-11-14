import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  QrCode,
  UtensilsCrossed,
  Receipt,
  IndianRupee,
  CalendarCheck,
  Bell,
  BarChart3,
  MessageSquareWarning,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserPlus,
  Scan,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Staff Management', path: '/admin/staff', icon: ShieldCheck },
    { name: 'Subscription Plans', path: '/admin/plans', icon: CreditCard },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: CalendarCheck },
    { name: 'Attendance Records', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'QR Scanner', path: '/admin/qr-scanner', icon: QrCode },
    { name: 'Food Menu', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Extra Meals', path: '/admin/extra-meals', icon: UtensilsCrossed },
    { name: 'Billing & Invoices', path: '/admin/billing', icon: Receipt },
    { name: 'Payments', path: '/admin/payments', icon: IndianRupee },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
    { name: 'Feedback & Complaints', path: '/admin/feedback', icon: MessageSquareWarning },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 shrink-0">
        {/* Brand */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
            BM
          </div>
          <div>
            <div className="font-extrabold text-base text-white tracking-tight">Baramati Messwala</div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Admin Portal</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.email?.split('@')[0]}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col z-10">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
              <div className="font-bold text-white text-sm">Baramati Messwala</div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {navItems.find((n) => n.path === location.pathname)?.name || 'Admin Management'}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Baramati Messwala • Manage Your Mess, The Smart Way!</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/admin/qr-scanner"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
            >
              <Scan className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan Attendance</span>
            </Link>

            <Link
              to="/admin/customers"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Customer</span>
            </Link>

            <Link
              to="/"
              target="_blank"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hidden md:block"
            >
              Public Site ↗
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
