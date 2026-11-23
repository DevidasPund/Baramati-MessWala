import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  QrCode,
  CreditCard,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Exactly the 8 sections requested for Baramati Messwala
  const navItems = [
    {
      name: 'डॅशबोर्ड',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      isActive: (pathname) => pathname === '/admin' || pathname === '/admin/dashboard',
    },
    {
      name: 'ग्राहक',
      path: '/admin/customers',
      icon: Users,
      isActive: (pathname) => pathname.startsWith('/admin/customers') || pathname.startsWith('/admin/customer-verification'),
    },
    {
      name: 'हजेरी (QR)',
      path: '/admin/qr-scanner',
      icon: QrCode,
      isActive: (pathname) => pathname.startsWith('/admin/qr-scanner') || pathname.startsWith('/admin/attendance') || pathname.startsWith('/admin/dabba-management'),
    },
    {
      name: 'बिलिंग / पेमेंट',
      path: '/admin/payment-management',
      icon: CreditCard,
      isActive: (pathname) => pathname.startsWith('/admin/payment-management') || pathname.startsWith('/admin/billing') || pathname.startsWith('/admin/payments'),
    },
    {
      name: 'आजचा मेनू',
      path: '/admin/menu',
      icon: UtensilsCrossed,
      isActive: (pathname) => pathname.startsWith('/admin/menu') || pathname.startsWith('/admin/extra-meals'),
    },
    {
      name: 'खर्च व किराणा',
      path: '/admin/reports?tab=grocery',
      icon: ShoppingBag,
      isActive: (pathname) => pathname.startsWith('/admin/reports') && location.search.includes('grocery'),
    },
    {
      name: 'अहवाल',
      path: '/admin/reports',
      icon: BarChart3,
      isActive: (pathname) => pathname.startsWith('/admin/reports') && !location.search.includes('grocery'),
    },
    {
      name: 'सेटिंग',
      path: '/admin/settings',
      icon: Settings,
      isActive: (pathname) => pathname.startsWith('/admin/settings'),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Authentic Marathi Live Date Formatter
  const getMarathiDate = (date = new Date()) => {
    const days = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const months = [
      'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
      'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
    ];
    const toDevanagari = (num) => num.toString().replace(/\d/g, (d) => '०१२३४५६७८९'[d]);

    const dayName = days[date.getDay()];
    const day = toDevanagari(date.getDate());
    const monthName = months[date.getMonth()];
    const year = toDevanagari(date.getFullYear());

    return `${dayName}, ${day} ${monthName} ${year}`;
  };

  const currentSection = navItems.find((n) => n.isActive(location.pathname))?.name || 'अॅडमिन पॅनेल';

  return (
    <div className="min-h-screen bg-[#FAF6ED] flex font-sans text-[#2D312E] selection:bg-[#205D48] selection:text-white">
      {/* 1. Fixed Dark Forest Green Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#205D48] text-white shrink-0 select-none shadow-xl border-r border-[#1B503E]">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/10 bg-[#1B503E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#205D48] flex items-center justify-center font-black text-lg shadow-sm">
              BM
            </div>
            <div>
              <div className="font-extrabold text-base text-white tracking-tight leading-tight">
                बारामती मेसवाला
              </div>
              <div className="text-[11px] text-emerald-200/90 font-medium tracking-wide">
                स्मार्ट मेस व्यवस्थापन
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1 scrollbar-thin scrollbar-thumb-emerald-800">
          {navItems.map((item) => {
            const isActive = item.isActive(location.pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-[#205D48] shadow-sm font-bold translate-x-0.5'
                    : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${isActive ? 'text-[#205D48]' : 'text-emerald-200/70'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#1B503E] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center text-xs font-black shrink-0 border border-white/20">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.name || 'अॅडमिन'}
              </div>
              <div className="text-[10px] text-emerald-200/80 font-medium truncate">
                मुख्य प्रशासक
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="लॉगआउट"
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
            <div className="h-18 px-5 flex items-center justify-between border-b border-white/10 bg-[#1B503E]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-[#205D48] flex items-center justify-center font-black text-sm">
                  BM
                </div>
                <div>
                  <div className="font-extrabold text-white text-sm">बारामती मेसवाला</div>
                  <div className="text-[10px] text-emerald-200/90 font-medium">अॅडमिन पॅनेल</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = item.isActive(location.pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-white text-[#205D48] font-bold shadow-sm'
                        : 'text-emerald-100/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3.5 border-t border-white/10 bg-[#1B503E] flex items-center justify-between">
              <span className="text-xs text-white/80 font-medium">{user?.name || 'अॅडमिन'}</span>
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
        {/* Top Navbar Header */}
        <header className="h-16 lg:h-18 bg-[#FAF6ED] border-b border-[#EAE3D2] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#205D48] hover:bg-[#205D48]/10 rounded-xl transition-colors cursor-pointer"
              title="मेनू उघडा"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden">
              <div className="font-extrabold text-sm text-[#205D48]">बारामती मेसवाला</div>
              <div className="text-[11px] text-stone-500 font-medium">{currentSection}</div>
            </div>

            {/* Desktop Admin Greeting & Marathi Live Date */}
            <div className="hidden lg:flex flex-col">
              <div className="font-black text-base text-[#2D312E] tracking-tight flex items-center gap-2">
                <span>नमस्कार, {user?.name || 'अॅडमिन'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#205D48] font-bold border border-emerald-200">
                  मुख्य व्यवस्थापक
                </span>
              </div>
              <div className="text-xs text-stone-500 font-semibold">
                {getMarathiDate()}
              </div>
            </div>
          </div>

          {/* Quick Header Navigation for Other Modules */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/admin/customer-verification"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-[#205D48] hover:bg-white rounded-xl transition-colors border border-transparent hover:border-[#EAE3D2]"
              title="ग्राहक पडताळणी"
            >
              <ShieldCheck className="w-4 h-4 text-[#205D48]" />
              <span>पडताळणी</span>
            </Link>

            <Link
              to="/admin/plans"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-[#205D48] hover:bg-white rounded-xl transition-colors border border-transparent hover:border-[#EAE3D2]"
              title="मेस सबस्क्रिप्शन प्लॅन्स"
            >
              <CreditCard className="w-4 h-4 text-[#205D48]" />
              <span>प्लॅन्स</span>
            </Link>

            <Link
              to="/admin/notifications"
              className="p-2 text-stone-600 hover:text-[#205D48] hover:bg-white rounded-xl transition-colors relative border border-transparent hover:border-[#EAE3D2]"
              title="सूचना केंद्र"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title="खात्यातून बाहेर पडा"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉगआउट</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-3 sm:p-7 max-w-7xl mx-auto w-full pb-24 lg:pb-7">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation for Owner (Quick Thumb Access) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE3D2] shadow-xl px-1 py-1 pb-safe flex items-center justify-around h-16">
          {[
            { name: 'डॅशबोर्ड', path: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'ग्राहक', path: '/admin/customers', icon: Users },
            { name: 'हजेरी (QR)', path: '/admin/qr-scanner', icon: QrCode },
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
                  isActive ? 'text-[#205D48] font-black scale-105' : 'text-stone-400 hover:text-stone-600'
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

