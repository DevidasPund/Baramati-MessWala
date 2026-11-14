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
  UserPlus,
  Scan,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'डॅशबोर्ड', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'ग्राहक व्यवस्थापन', path: '/admin/customers', icon: Users },
    { name: 'कर्मचारी व्यवस्थापन', path: '/admin/staff', icon: ShieldCheck },
    { name: 'सबस्क्रिप्शन प्लॅन', path: '/admin/plans', icon: CreditCard },
    { name: 'ग्राहक सबस्क्रिप्शन', path: '/admin/subscriptions', icon: CalendarCheck },
    { name: 'हजेरी व्यवस्थापन', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'QR कोड स्कॅनर', path: '/admin/qr-scanner', icon: QrCode },
    { name: 'जेवणाचा मेनू', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'अतिरिक्त जेवण', path: '/admin/extra-meals', icon: UtensilsCrossed },
    { name: 'बिलिंग आणि पावत्या', path: '/admin/billing', icon: Receipt },
    { name: 'पेमेंट व्यवस्थापन', path: '/admin/payments', icon: IndianRupee },
    { name: 'सूचना', path: '/admin/notifications', icon: Bell },
    { name: 'अहवाल आणि विश्लेषण', path: '/admin/reports', icon: BarChart3 },
    { name: 'अभिप्राय आणि तक्रारी', path: '/admin/feedback', icon: MessageSquareWarning },
    { name: 'व्यवसाय सेटिंग्ज', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentSection = navItems.find((n) => n.path === location.pathname)?.name || 'प्रशासक पोर्टल';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* 1. Professional Dark Navy Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0f172a] border-r border-slate-800 text-slate-300 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800 bg-[#090d16]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
            BM
          </div>
          <div>
            <div className="font-extrabold text-base text-white tracking-tight leading-tight">Baramati Messwala</div>
            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">प्रशासक पोर्टल (Admin)</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090d16] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.email?.split('@')[0] || 'व्यवस्थापक'}</div>
              <div className="text-[10px] text-blue-400 font-semibold truncate">{user?.role || 'SUPER_ADMIN'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="लॉगआउट"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-[#0f172a] border-r border-slate-800 text-slate-300 flex flex-col z-10 shadow-2xl">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-[#090d16]">
              <div className="font-extrabold text-white text-sm">बारामती मेसवाला</div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* 2. Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 hidden sm:inline">बारामती मेसवाला</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900">{currentSection}</h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                मेस व्यवस्थापन प्रणाली • स्मार्ट, सोपी आणि डिजिटल!
              </p>
            </div>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>मराठी</span>
            </div>

            {/* Notification Bell */}
            <Link
              to="/admin/notifications"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors relative"
              title="सूचना"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </Link>

            {/* Quick Action: QR Scan */}
            <Link
              to="/admin/qr-scanner"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors shadow-2xs"
            >
              <Scan className="w-3.5 h-3.5" />
              <span className="hidden md:inline">हजेरी QR स्कॅन</span>
            </Link>

            {/* Quick Action: Add Customer */}
            <Link
              to="/admin/customers"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ नवीन ग्राहक</span>
            </Link>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-slate-200 hidden sm:flex">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="खात्यातून बाहेर पडा"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">लॉगआउट</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-7 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
