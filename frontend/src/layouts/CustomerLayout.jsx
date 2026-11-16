import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Receipt,
  CreditCard,
  UtensilsCrossed,
  Utensils,
  Bell,
  MessageSquare,
  QrCode,
  Scan,
  User,
  LogOut,
  Sparkles,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CustomerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const customer = user?.customer;

  const navLinks = [
    { name: 'डॅशबोर्ड', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'दैनिक हजेरी', path: '/customer/attendance', icon: CalendarCheck },
    { name: 'माझे सबस्क्रिप्शन', path: '/customer/subscription', icon: Sparkles },
    { name: 'आजचा मेनू', path: '/customer/menu', icon: Utensils },
    { name: 'अतिरिक्त जेवण', path: '/customer/extra-meals', icon: UtensilsCrossed },
    { name: 'माझे बिल व पेमेंट', path: '/customer/bills', icon: Receipt },
    { name: 'सूचना', path: '/customer/notifications', icon: Bell },
    { name: 'तक्रार / अभिप्राय', path: '/customer/feedback', icon: MessageSquare },
    { name: 'माझे QR कोड', path: '/customer/my-qr', icon: QrCode },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-8">
      {/* Top Blue Navigation Bar (Inspired by Reference Screenshot) */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: MessMate Logo + Title */}
          <Link to="/customer/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
              <Utensils className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg tracking-tight leading-tight flex items-center gap-2">
                <span>मेस हजेरी - माझे खाते</span>
              </div>
              <div className="text-[11px] text-blue-100 font-medium">बारामती मेसवाला</div>
            </div>
          </Link>

          {/* Right: Customer Info + Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white tracking-wide">
                {customer?.name || user?.email}
              </div>
              <div className="text-[11px] font-mono font-semibold text-blue-100">
                {customer?.customerCode || 'BMW-MEMBER'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
              title="खात्यातून बाहेर पडा"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">बाहेर पडा</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white/90 hover:text-white md:hidden rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Secondary Sub-navigation Bar */}
        <div className="hidden md:block bg-blue-800/40 border-t border-white/10 backdrop-blur-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/customer/bills' && location.pathname === '/customer/payments');
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-800 border-t border-white/10 px-4 py-3 space-y-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Mobile-First Bottom Floating Navigation Bar (Min 44px Touch Targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-2 py-1 flex items-center justify-around h-16">
        {[
          { name: 'डॅशबोर्ड', path: '/customer/dashboard', icon: LayoutDashboard },
          { name: 'हजेरी', path: '/customer/attendance', icon: CalendarCheck },
          { name: 'माझे QR', path: '/customer/my-qr', icon: QrCode },
          { name: 'बिल', path: '/customer/bills', icon: Receipt },
          { name: 'मेनू', path: '/customer/menu', icon: Utensils },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`min-h-[44px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-[#205D48] font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform" />
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
