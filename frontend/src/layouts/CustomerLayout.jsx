import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  Scan,
  CalendarCheck,
  Receipt,
  User,
  LogOut,
  Utensils,
  Bell,
  UtensilsCrossed,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CustomerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const customer = user?.customer;

  const navLinks = [
    { name: 'Home', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'My QR', path: '/customer/my-qr', icon: QrCode },
    { name: 'Scan Mess', path: '/customer/scan-mess', icon: Scan },
    { name: 'Attendance', path: '/customer/attendance', icon: CalendarCheck },
    { name: 'Bills & Pay', path: '/customer/bills', icon: Receipt },
    { name: 'Extra Meals', path: '/customer/extra-meals', icon: UtensilsCrossed },
    { name: 'Feedback', path: '/customer/feedback', icon: MessageSquare },
    { name: 'Profile', path: '/customer/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/customer/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 leading-tight">Baramati Messwala</div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Member Portal</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{customer?.name || user?.email}</div>
              <div className="text-[10px] font-mono text-emerald-700 font-bold">{customer?.customerCode}</div>
            </div>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop secondary navigation bar */}
        <div className="hidden md:block border-t border-slate-100 bg-slate-50/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-2 py-2 overflow-x-auto">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Mobile-First Bottom Floating Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around">
        {[
          { name: 'Home', path: '/customer/dashboard', icon: LayoutDashboard },
          { name: 'My QR', path: '/customer/my-qr', icon: QrCode },
          { name: 'Scan', path: '/customer/scan-mess', icon: Scan },
          { name: 'History', path: '/customer/attendance', icon: CalendarCheck },
          { name: 'Bills', path: '/customer/bills', icon: Receipt },
          { name: 'Profile', path: '/customer/profile', icon: User },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
