import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Scan,
  Utensils,
  CalendarCheck,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Coffee,
  Moon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const customer = user?.customer;

  const [todayMenu, setTodayMenu] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profileRes, menuRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/menu/today'),
        ]);

        if (profileRes?.data?.user?.customer) {
          setProfileData(profileRes.data.user.customer);
        }
        if (menuRes?.data?.menus) {
          setTodayMenu(menuRes.data.menus);
        }
      } catch (err) {
        console.error('Customer dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const activeSub = profileData?.subscriptions?.[0] || customer?.subscriptions?.[0];

  // Compute days left
  let daysLeft = 0;
  if (activeSub?.endDate) {
    const diff = new Date(activeSub.endDate).getTime() - new Date().getTime();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Member Portal • Baramati Messwala</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {customer?.name || 'Member'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Pass ID: <span className="font-mono font-bold text-white">{customer?.customerCode}</span> • Enjoy hot, healthy meals served fresh daily.
          </p>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Membership Status</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            activeSub?.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700'
              : activeSub?.status === 'PAUSED'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-rose-50 text-rose-700'
          }`}>
            {activeSub?.status || 'INACTIVE'}
          </span>
        </div>

        {activeSub ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Plan</span>
              <div className="text-sm font-bold text-slate-900">{activeSub.plan.name}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                Meals: {activeSub.plan.includedMeals.join(' + ')}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Valid Until</span>
              <div className="text-sm font-bold text-slate-900">
                {new Date(activeSub.endDate).toLocaleDateString()}
              </div>
              <span className="text-[11px] text-slate-500">
                Started {new Date(activeSub.startDate).toLocaleDateString()}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Days Remaining</span>
                <div className="text-2xl font-black text-emerald-700">{daysLeft} Days</div>
              </div>
              <Link
                to="/customer/bills"
                className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>View Plan Invoices</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">You currently do not have an active mess plan.</p>
            <Link
              to="/plans"
              className="inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              Choose a Meal Plan
            </Link>
          </div>
        )}
      </div>

      {/* Quick Attendance Actions (Dual QR Methods) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quick Personal QR Card */}
        <Link
          to="/customer/my-qr"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Method B
            </span>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Show My Personal QR
            </h3>
            <p className="text-xs text-slate-500">Present to staff at the dining counter</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
            {customer?.qrToken ? (
              <QRCodeSVG value={customer.qrToken} size={48} level="L" />
            ) : (
              <QrCode className="w-6 h-6 text-slate-400" />
            )}
          </div>
        </Link>

        {/* Scan Mess QR Card */}
        <Link
          to="/customer/scan-mess"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              Method A
            </span>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Scan Mess Counter QR
            </h3>
            <p className="text-xs text-slate-500">Self-mark attendance using your camera</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Scan className="w-7 h-7" />
          </div>
        </Link>
      </div>

      {/* Today's Food Menu Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Today's Kitchen Menu</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{new Date().toLocaleDateString()}</span>
        </div>

        {todayMenu.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {todayMenu.map((m) => (
              <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    m.mealType === 'BREAKFAST'
                      ? 'bg-orange-100 text-orange-700'
                      : m.mealType === 'LUNCH'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {m.mealType}
                  </span>
                  {m.isSpecial && <span className="text-[10px] font-bold text-amber-600">★ Feast</span>}
                </div>
                <div className="text-xs font-bold text-slate-900">{m.title}</div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  {Array.isArray(m.items) ? m.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="truncate">{it}</span>
                    </div>
                  )) : (
                    <div>{m.items}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">Menu schedule is being finalized for today.</p>
        )}
      </div>

      {/* Quick Links Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/customer/extra-meals"
          className="p-4 bg-white rounded-2xl border border-slate-200 text-center hover:border-emerald-500 shadow-2xs transition-all space-y-1"
        >
          <div className="text-xs font-bold text-slate-800">Book Extra Meal</div>
          <p className="text-[10px] text-slate-400">Breakfast/Lunch/Dinner</p>
        </Link>

        <Link
          to="/customer/extra-meals"
          className="p-4 bg-white rounded-2xl border border-slate-200 text-center hover:border-emerald-500 shadow-2xs transition-all space-y-1"
        >
          <div className="text-xs font-bold text-slate-800">Skip a Meal</div>
          <p className="text-[10px] text-slate-400">Save meal credits</p>
        </Link>

        <Link
          to="/customer/bills"
          className="p-4 bg-white rounded-2xl border border-slate-200 text-center hover:border-emerald-500 shadow-2xs transition-all space-y-1"
        >
          <div className="text-xs font-bold text-slate-800">Pay Monthly Bill</div>
          <p className="text-[10px] text-slate-400">UPI or Cash receipt</p>
        </Link>

        <Link
          to="/customer/feedback"
          className="p-4 bg-white rounded-2xl border border-slate-200 text-center hover:border-emerald-500 shadow-2xs transition-all space-y-1"
        >
          <div className="text-xs font-bold text-slate-800">Rating & Support</div>
          <p className="text-[10px] text-slate-400">Tell us how we did</p>
        </Link>
      </div>
    </div>
  );
};
