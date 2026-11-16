import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  CalendarCheck,
  CreditCard,
  Receipt,
  User,
  QrCode,
  Scan,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Filter,
  Check,
  Minus,
  ShoppingBag,
  RotateCcw,
  MessageCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboardPage = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [activeTab, setActiveTab] = useState('dabba'); // 'dabba', 'attendance', 'payments'

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const marathiMonths = [
    { num: 1, name: 'जानेवारी' },
    { num: 2, name: 'फेब्रुवारी' },
    { num: 3, name: 'मार्च' },
    { num: 4, name: 'एप्रिल' },
    { num: 5, name: 'मे' },
    { num: 6, name: 'जून' },
    { num: 7, name: 'जुलै' },
    { num: 8, name: 'ऑगस्ट' },
    { num: 9, name: 'सप्टेंबर' },
    { num: 10, name: 'ऑक्टोबर' },
    { num: 11, name: 'नोव्हेंबर' },
    { num: 12, name: 'डिसेंबर' },
  ];

  const fetchDashboardStats = async (m, y) => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/me/dashboard?month=${m}&year=${y}`);
      if (res?.data) {
        setStatsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer stats:', err);
      toast.error('डॅशबोर्ड माहिती लोड करण्यात अडचण आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const customer = statsData?.customer || user?.customer;
  const kpis = statsData?.kpis || {
    totalMealsAttended: 0,
    currentMonthMealsAttended: 0,
    outstandingBalance: 0,
    monthlyTotalExpense: 0,
  };
  const dailyRecords = statsData?.dailyRecords || [];
  const payments = statsData?.payments || [];
  const activeSub = statsData?.activeSubscription || customer?.subscriptions?.[0];
  const todayMenu = statsData?.todayMenu || [];
  const todayDabbas = statsData?.todayDabbas || [];
  const recentDabbas = statsData?.recentDabbas || [];

  // Calculate days left in subscription
  let daysLeft = 0;
  if (activeSub?.endDate) {
    const diff = new Date(activeSub.endDate).getTime() - new Date().getTime();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Calculate initials
  const initials = customer?.name
    ? customer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'BM';

  // Monthly attendance sums
  const totalAttendedDays = dailyRecords.filter((d) => d.attendedCount > 0).length;
  const totalCalculatedAmount = dailyRecords.reduce((acc, d) => acc + (d.amount || 0), 0);

  // Today dabba statuses
  const todayLunchDabba = todayDabbas.find((d) => d.mealType === 'LUNCH');
  const todayDinnerDabba = todayDabbas.find((d) => d.mealType === 'DINNER');

  return (
    <div className="space-y-4 sm:space-y-6 font-sans pb-16 md:pb-6">
      {/* 1. Official Baramati Messwala Customer Header Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Initials Avatar with Baramaticha Dabewala Badge */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#205D48] text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-md shadow-[#205D48]/20">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-slate-900 rounded-full shadow-xs">
                <Utensils className="w-3 h-3" />
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  {customer?.name || 'सन्माननीय सदस्य'}
                </h1>

                {/* Account Verification Badge */}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>खाते मंजूर व सक्रिय ✅</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <div>
                  <span className="text-slate-400">कोड:</span>{' '}
                  <span className="font-mono font-bold text-[#205D48] bg-emerald-50 px-2 py-0.5 rounded-md">
                    {customer?.customerCode || 'BMW-MEMBER'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">मोबाइल:</span>{' '}
                  <span className="font-bold text-slate-800">{customer?.phone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions (WhatsApp & Profile) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href="https://wa.me/919876543210?text=नमस्कार,%20बारामती%20मेसवाला%20डबा%20मदत"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>मेस WhatsApp संपर्क</span>
            </a>

            <Link
              to="/customer/my-qr"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all min-h-[44px]"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">माझे QR कोड</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S DABBA STATUS (Dedicated Dabba Tracker Section 7 & 8) */}
      <div className="bg-gradient-to-br from-[#205D48] to-[#164233] text-white rounded-3xl p-4 sm:p-6 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-300" />
            <h2 className="text-sm sm:text-base font-black tracking-tight">आजची डबा स्थिती (Today's Dabba Status)</h2>
          </div>
          <span className="text-[11px] text-emerald-200 font-medium">
            {new Date().toLocaleDateString('mr-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* 2 Meal Boxes: Lunch & Dinner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Lunch Dabba */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-200">दुपारचा डबा (Lunch)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  todayLunchDabba?.status === 'RETURNED'
                    ? 'bg-blue-400 text-slate-900'
                    : todayLunchDabba?.status === 'GIVEN'
                    ? 'bg-emerald-400 text-slate-900'
                    : 'bg-amber-300 text-slate-900'
                }`}
              >
                {todayLunchDabba?.status === 'RETURNED'
                  ? 'डबा जमा ✅'
                  : todayLunchDabba?.status === 'GIVEN'
                  ? 'डबा स्वीकारला (हजेरी ✅)'
                  : todayLunchDabba?.status === 'PREPARED'
                  ? 'डबा तयार आहे'
                  : 'द्यायचा बाकी'}
              </span>
            </div>
            <div className="text-[11px] text-white/80">
              {todayLunchDabba?.givenAt
                ? `स्वीकार वेळ: ${new Date(todayLunchDabba.givenAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'डबा काउंटरवर स्वीकारल्यावर येथे हजेरी दिसेल.'}
            </div>
          </div>

          {/* Dinner Dabba */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-200">रात्रीचा डबा (Dinner)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  todayDinnerDabba?.status === 'RETURNED'
                    ? 'bg-blue-400 text-slate-900'
                    : todayDinnerDabba?.status === 'GIVEN'
                    ? 'bg-emerald-400 text-slate-900'
                    : 'bg-amber-300 text-slate-900'
                }`}
              >
                {todayDinnerDabba?.status === 'RETURNED'
                  ? 'डबा जमा ✅'
                  : todayDinnerDabba?.status === 'GIVEN'
                  ? 'डबा स्वीकारला (हजेरी ✅)'
                  : todayDinnerDabba?.status === 'PREPARED'
                  ? 'डबा तयार आहे'
                  : 'द्यायचा बाकी'}
              </span>
            </div>
            <div className="text-[11px] text-white/80">
              {todayDinnerDabba?.givenAt
                ? `स्वीकार वेळ: ${new Date(todayDinnerDabba.givenAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'डबा काउंटरवर स्वीकारल्यावर येथे हजेरी दिसेल.'}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-emerald-100/90 pt-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-300" />
          <span>नियम: डबा स्वीकारल्यासच हजेरी नोंदवली जाते. डबा परत जमा केल्यावर कोणतीही अतिरिक्त हजेरी लागत नाही.</span>
        </div>
      </div>

      {/* 3. Four Compact Mobile KPI Cards (2-Column Grid on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: एकूण उपस्थिती */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              एकूण हजेरी
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
              {kpis.totalMealsAttended}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">स्वीकारलेले एकूण डबे</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-[#205D48] flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: देयक बाकी (Owner Confirmed Paid Rule) */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              देय बाकी रक्कम
            </div>
            <div
              className={`text-xl sm:text-3xl font-black mt-1 ${
                Number(kpis.outstandingBalance) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              ₹{Number(kpis.outstandingBalance).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {Number(kpis.outstandingBalance) > 0 ? 'मालक मंजुरीनुसार बाकी' : 'सर्व देणी पूर्ण भरली ✅'}
            </div>
          </div>
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              Number(kpis.outstandingBalance) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: चालू महिना हजेरी */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              चालू महिना डबे
            </div>
            <div className="text-xl sm:text-3xl font-black text-[#205D48] mt-1">
              {kpis.currentMonthMealsAttended}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {marathiMonths.find((m) => m.num === selectedMonth)?.name} महिना
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 4: चालू सबस्क्रिप्शन */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              उर्वरित दिवस
            </div>
            <div className="text-xl sm:text-3xl font-black text-amber-600 mt-1">{daysLeft} दिवस</div>
            <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
              {activeSub?.plan?.name || 'मासिक प्लॅन'}
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* 4. TODAY'S FOOD MENU CARD */}
      {todayMenu.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#EAE3D2] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#205D48]" />
              <span>आजचा खास मेस मेनू (Today's Menu)</span>
            </h3>
            <Link to="/customer/menu" className="text-xs font-bold text-[#205D48] hover:underline">
              संपूर्ण आठवडा मेनू पहा →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {todayMenu.map((m) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#205D48]">
                  <span>{m.mealType === 'LUNCH' ? 'दुपारचे जेवण (Lunch)' : 'रात्रीचे जेवण (Dinner)'}</span>
                  {m.isPublished && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      उपलब्ध
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-slate-900">{m.title}</div>
                <div className="text-xs text-slate-600 flex flex-wrap gap-1.5 pt-1">
                  {Array.isArray(m.items) ? m.items.join(' • ') : m.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TABS: Daily Dabba History, Attendance, Billing */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('dabba')}
            className={`flex-1 min-w-[130px] min-h-[42px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'dabba'
                ? 'bg-white text-[#205D48] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>डबा इतिहास (Dabba)</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 min-w-[130px] min-h-[42px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-white text-[#205D48] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>मासिक हजेरी तक्ता</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 min-w-[130px] min-h-[42px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-white text-[#205D48] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>पेमेंट व बिले</span>
          </button>
        </div>

        {/* TAB 1: DABBA HISTORY */}
        {activeTab === 'dabba' && (
          <div className="p-4 sm:p-6 space-y-3">
            <div className="text-xs font-bold text-slate-700">
              आपण स्वीकारलेल्या व परत जमा केलेल्या डब्यांची नोंद:
            </div>

            {recentDabbas.length > 0 ? (
              <div className="space-y-2">
                {recentDabbas.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{new Date(d.date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {d.mealType === 'LUNCH' ? 'दुपार' : 'रात्र'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {d.givenAt && (
                          <span>स्वीकारला: {new Date(d.givenAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {d.returnedAt && (
                          <span> • जमा केला: {new Date(d.returnedAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        d.status === 'RETURNED'
                          ? 'bg-blue-100 text-blue-800'
                          : d.status === 'GIVEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status === 'RETURNED' ? 'डबा जमा ✅' : d.status === 'GIVEN' ? 'स्वीकारला (हजेरी ✅)' : 'तयार आहे'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                सध्या डबा नोंदी उपलब्ध नाहीत.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ATTENDANCE CALENDAR TABLE */}
        {activeTab === 'attendance' && (
          <div className="p-3 sm:p-6 space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">तारीख</th>
                    <th className="py-2.5 px-3 text-center">दुपार (Lunch)</th>
                    <th className="py-2.5 px-3 text-center">रात्र (Dinner)</th>
                    <th className="py-2.5 px-3 text-right">रक्कम</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dailyRecords.map((d) => (
                    <tr key={d.date} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{d.date.slice(8)} तारीख</td>
                      <td className="py-2 px-3 text-center">
                        {d.lunch ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                            उपस्थित ✅
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {d.dinner ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                            उपस्थित ✅
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">₹{d.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS LIST */}
        {activeTab === 'payments' && (
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-bold text-slate-700">पेमेंट नोंदी</span>
              <Link
                to="/customer/bills"
                className="px-3 py-1.5 bg-[#205D48] text-white rounded-xl text-xs font-bold min-h-[38px] flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>UPI पेमेंट करा</span>
              </Link>
            </div>

            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        ₹{Number(p.amount)} • {p.paymentMethod}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString('mr-IN')} {p.transactionRef ? `• UTR: ${p.transactionRef}` : ''}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.status === 'VERIFIED'
                        ? 'मंजूर (PAID ✅)'
                        : p.status === 'PENDING'
                        ? 'पडताळणी प्रलंबित ⏳'
                        : 'नाकारले ✕'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                कोणतीही पेमेंट नोंद आढळली नाही.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
