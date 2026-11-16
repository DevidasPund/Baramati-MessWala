import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Receipt,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  Scan,
  ShieldCheck,
  CreditCard,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Exactly the 8 screenshot navigation items
  const navItems = [
    { name: 'डॅशबोर्ड', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'ग्राहक पडताळणी', path: '/admin/customer-verification', icon: ShieldCheck },
    { name: 'ग्राहक यादी', path: '/admin/customers', icon: Users },
    { name: 'डबा व हजेरी', path: '/admin/dabba-management', icon: ShoppingBag },
    { name: 'पेमेंट मॅनेजमेंट', path: '/admin/payment-management', icon: CreditCard },
    { name: 'आजचा मेनू', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'बिलिंग / इन्व्हॉइस', path: '/admin/billing', icon: Receipt },
    { name: 'अहवाल', path: '/admin/reports', icon: BarChart3 },
    { name: 'सेटिंग्ज', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentSection = navItems.find((n) => n.path === location.pathname)?.name || 'अॅडमिन पॅनेल';

  return (
    <div className="min-h-screen bg-[#FAF6ED] flex font-sans text-[#2D312E] selection:bg-[#205D48] selection:text-white">
      {/* 1. Fixed Dark Forest Green Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#205D48] text-white shrink-0 select-none shadow-lg">
        {/* Brand Header */}
        <div className="h-24 px-6 flex flex-col justify-center border-b border-white/10 bg-[#1B503E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#205D48] flex items-center justify-center font-black text-lg shadow-sm">
              BM
            </div>
            <div>
              <div className="font-extrabold text-base text-white tracking-tight leading-tight">
                बारामती मेसवाला
              </div>
              <div className="text-xs text-emerald-200/90 font-medium tracking-wide">
                अॅडमिन पॅनेल
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-800">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-[#205D48] shadow-sm font-bold'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#205D48]' : 'text-white/80'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout footer */}
        <div className="p-4 border-t border-white/10 bg-[#1B503E] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center text-xs font-black shrink-0 border border-white/20">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.name || user?.email?.split('@')[0] || 'अॅडमिन'}
              </div>
              <div className="text-[10px] text-emerald-200/80 font-medium truncate">
                मुख्य प्रशासक
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="लॉगआउट"
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-[#205D48] text-white flex flex-col z-10 shadow-2xl">
            <div className="h-20 px-6 flex items-center justify-between border-b border-white/10 bg-[#1B503E]">
              <div>
                <div className="font-extrabold text-white text-base">बारामती मेसवाला</div>
                <div className="text-xs text-emerald-200/90 font-medium">अॅडमिन पॅनेल</div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-white text-[#205D48] font-bold shadow-sm'
                        : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 bg-[#1B503E] flex items-center justify-between">
              <span className="text-xs text-white/80 font-medium">अॅडमिन सत्र</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>बाहेर पडा</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar for Mobile & Header Details */}
        <header className="h-16 lg:h-18 bg-[#FAF6ED] border-b border-[#EAE3D2] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#205D48] hover:bg-[#205D48]/10 rounded-xl transition-colors"
              title="मेनू उघडा"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden">
              <div className="font-extrabold text-sm text-[#205D48]">बारामती मेसवाला</div>
              <div className="text-[11px] text-stone-500 font-medium">{currentSection}</div>
            </div>
          </div>

          {/* Quick Header Navigation for Other Modules */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/admin/customer-verification"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-[#205D48] hover:bg-white/70 rounded-xl transition-colors border border-transparent hover:border-[#EAE3D2]"
              title="ग्राहक पडताळणी"
            >
              <ShieldCheck className="w-4 h-4 text-[#205D48]" />
              <span>पडताळणी</span>
            </Link>

            <Link
              to="/admin/subscriptions"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-[#205D48] hover:bg-white/70 rounded-xl transition-colors border border-transparent hover:border-[#EAE3D2]"
              title="सबस्क्रिप्शन प्लॅन्स"
            >
              <CreditCard className="w-4 h-4 text-[#205D48]" />
              <span>प्लॅन्स</span>
            </Link>

            <Link
              to="/admin/notifications"
              className="p-2 text-stone-600 hover:text-[#205D48] hover:bg-white rounded-xl transition-colors relative border border-transparent hover:border-[#EAE3D2]"
              title="सूचना"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </Link>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
              title="खात्यातून बाहेर पडा"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉगआउट</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-3 sm:p-7 max-w-7xl mx-auto w-full pb-20 lg:pb-7">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation for Owner (Quick Thumb Access) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-1 py-1 flex items-center justify-around h-16">
          {[
            { name: 'डॅशबोर्ड', path: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'पडताळणी', path: '/admin/customer-verification', icon: ShieldCheck },
            { name: 'डबा/हजेरी', path: '/admin/dabba-management', icon: ShoppingBag },
            { name: 'पेमेंट', path: '/admin/payment-management', icon: CreditCard },
            { name: 'मेनू', path: '/admin/menu', icon: UtensilsCrossed },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`min-h-[44px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
                  isActive ? 'text-[#205D48] font-black scale-105' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform" />
                <span className="text-[10px] mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
