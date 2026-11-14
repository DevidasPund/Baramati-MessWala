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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'payments'

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

  // Calculate days left in subscription
  let daysLeft = 0;
  if (activeSub?.endDate) {
    const diff = new Date(activeSub.endDate).getTime() - new Date().getTime();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Calculate initials
  const initials = customer?.name
    ? customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'BM';

  // Monthly attendance sums
  const totalAttendedDays = dailyRecords.filter((d) => d.attendedCount > 0).length;
  const totalCalculatedAmount = dailyRecords.reduce((acc, d) => acc + (d.amount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Customer Profile Card (Inspired by Reference Screenshot) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Initials Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {customer?.name || 'सन्माननीय सदस्य'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                  activeSub?.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : activeSub?.status === 'PAUSED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {activeSub?.status === 'ACTIVE' ? 'सक्रिय (Active)' : activeSub?.status === 'PAUSED' ? 'स्थगित (Paused)' : 'निष्क्रिय (Inactive)'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                <div>
                  <span className="text-slate-400">ग्राहक ID:</span>{' '}
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {customer?.customerCode || 'BMW-2026-MEMBER'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">मोबाइल:</span>{' '}
                  <span className="font-bold text-slate-800">{customer?.phone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Summary Badge */}
          <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3.5 sm:p-0 rounded-2xl border sm:border-0 border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              चालू सबस्क्रिप्शन प्लॅन
            </div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              {activeSub?.plan?.name || 'मासिक मेस सबस्क्रिप्शन'}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              उर्वरित दिवस: <span className="font-bold text-blue-600">{daysLeft} दिवस</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four KPI Cards (Reference Screenshot Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: एकूण जेवणे */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              एकूण जेवणे
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {kpis.totalMealsAttended}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              नोंदणीपासून एकूण उपस्थिती
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: बाकी रक्कम */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              बाकी रक्कम
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
              Number(kpis.outstandingBalance) > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              ₹{Number(kpis.outstandingBalance).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {Number(kpis.outstandingBalance) > 0 ? 'थकबाकी भरा' : 'सर्व देणी पूर्ण भरली'}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            Number(kpis.outstandingBalance) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: या महिन्यातील जेवणे */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              या महिन्यातील जेवणे
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
              {kpis.currentMonthMealsAttended}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {marathiMonths.find((m) => m.num === selectedMonth)?.name} महिन्यातील हजेरी
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: या महिन्यातील खर्च */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              या महिन्यातील खर्च
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1">
              ₹{Number(kpis.monthlyTotalExpense).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              प्लॅन + अतिरिक्त जेवण
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Quick Action Buttons Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/customer/menu"
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="text-left truncate">
            <div className="text-xs font-bold text-slate-800">आजचा मेनू</div>
            <div className="text-[10px] text-slate-400">काय बनवले आहे?</div>
          </div>
        </Link>

        <Link
          to="/customer/my-qr"
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="text-left truncate">
            <div className="text-xs font-bold text-slate-800">माझे QR कोड</div>
            <div className="text-[10px] text-slate-400">हजेरीसाठी दाखवा</div>
          </div>
        </Link>

        <Link
          to="/customer/extra-meals"
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left truncate">
            <div className="text-xs font-bold text-slate-800">अतिरिक्त जेवण</div>
            <div className="text-[10px] text-slate-400">पाहुण्यांचे जेवण</div>
          </div>
        </Link>

        <Link
          to="/customer/bills"
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-left truncate">
            <div className="text-xs font-bold text-slate-800">माझे बिल व UPI</div>
            <div className="text-[10px] text-slate-400">थकबाकी भरा</div>
          </div>
        </Link>
      </div>

      {/* 4. Two Main Tabs: दैनिक हजेरी & आगाऊ रक्कम इतिहास */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>दैनिक हजेरी (Daily Attendance)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>आगाऊ रक्कम इतिहास (Payment History)</span>
          </button>
        </div>

        {/* Tab 1 Content: दैनिक हजेरी */}
        {activeTab === 'attendance' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Filter Bar: महिना निवडा & वर्ष निवडा */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>हजेरी तपशील पहा:</span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Month Dropdown */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {marathiMonths.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.name}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={2026}>२०२६</option>
                  <option value={2025}>२०२५</option>
                </select>
              </div>
            </div>

            {/* Attendance Table */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">हजेरी माहिती लोड होत आहे...</p>
              </div>
            ) : dailyRecords.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-3 px-4">तारीख</th>
                      <th className="py-3 px-4 text-center">सकाळचे जेवण</th>
                      <th className="py-3 px-4 text-center">दुपारचे जेवण</th>
                      <th className="py-3 px-4 text-center">रात्रीचे जेवण</th>
                      <th className="py-3 px-4 text-right">दर (₹)</th>
                      <th className="py-3 px-4 text-right">रक्कम (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {dailyRecords.map((d) => (
                      <tr key={d.date} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {new Date(d.date).toLocaleDateString('mr-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Breakfast */}
                        <td className="py-3 px-4 text-center">
                          {d.breakfast ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>उपस्थित</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* Lunch */}
                        <td className="py-3 px-4 text-center">
                          {d.lunch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>उपस्थित</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* Dinner */}
                        <td className="py-3 px-4 text-center">
                          {d.dinner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>उपस्थित</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>

                        {/* Rate */}
                        <td className="py-3 px-4 text-right text-slate-500 font-mono">
                          ₹{d.rate}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                          ₹{d.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Monthly Summary Footer */}
                  <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-200 text-xs">
                    <tr>
                      <td className="py-3 px-4">एकूण महिना बेरीज</td>
                      <td colSpan={3} className="py-3 px-4 text-center text-blue-700">
                        {totalAttendedDays} दिवस हजेरी नोंदवली
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">एकूण हजेरी मूल्य:</td>
                      <td className="py-3 px-4 text-right font-extrabold text-blue-700 text-sm font-mono">
                        ₹{totalCalculatedAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p>या निवडलेल्या महिन्यात कोणतीही हजेरी नोंदवलेली नाही.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Content: आगाऊ रक्कम इतिहास (Advance / Payment History) */}
        {activeTab === 'payments' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-700">
                आपण केलेले सर्व पेमेंट व आगाऊ रक्कम नोंदी:
              </div>
              <Link
                to="/customer/bills"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>नवीन पेमेंट करा (UPI)</span>
              </Link>
            </div>

            {payments.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-3 px-4">व्यवहार तारीख</th>
                      <th className="py-3 px-4">व्यवहार क्रमांक (Ref)</th>
                      <th className="py-3 px-4">पेमेंट पद्धत</th>
                      <th className="py-3 px-4 text-right">जमा रक्कम (₹)</th>
                      <th className="py-3 px-4 text-center">व्यवहार स्थिती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-900 font-semibold">
                          {new Date(p.createdAt).toLocaleDateString('mr-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {p.transactionRef || p.paymentNumber || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {p.paymentMethod === 'UPI' ? 'ऑनलाइन UPI' : 'रोख (Cash)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono text-sm">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {p.status === 'VERIFIED'
                              ? '✓ मंजूर (Approved)'
                              : p.status === 'PENDING'
                              ? '⏳ प्रलंबित (Pending)'
                              : '✕ नाकारले (Rejected)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p>कोणत्याही पेमेंट नोंदी आढळल्या नाहीत.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
