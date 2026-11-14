import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  Coffee,
  Utensils,
  Moon,
  IndianRupee,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  UtensilsCrossed,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('month'); // 'today', 'yesterday', 'week', 'month', 'last_month', 'custom'

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/dashboard-stats');
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Dashboard stats error:', err);
      setError(err.message || 'डॅशबोर्ड माहिती लोड करण्यात अडचण आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-6 font-sans">
        <div className="flex items-center justify-between pb-2">
          <div className="h-6 w-56 bg-slate-200 rounded-lg animate-pulse" />
          <span className="text-xs text-slate-400 font-bold">मेस डेटा लोड होत आहे...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-72 bg-slate-200 rounded-2xl lg:col-span-2" />
          <div className="h-72 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">डॅशबोर्ड माहिती उपलब्ध नाही</h3>
        <p className="text-xs text-slate-500 max-w-md">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          पुन्हा प्रयत्न करा (Retry)
        </button>
      </div>
    );
  }

  const { kpis, charts, activities } = stats;

  // 8 Exact Dashboard KPI Cards as requested
  const kpiCards = [
    {
      title: 'एकूण ग्राहक',
      value: kpis.totalCustomers,
      subtitle: 'नोंदणीकृत सदस्य',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      link: '/admin/customers',
    },
    {
      title: 'सक्रिय ग्राहक',
      value: kpis.activeCustomers,
      subtitle: 'सध्या जेवण घेणारे',
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      link: '/admin/customers?status=ACTIVE',
    },
    {
      title: 'आजची एकूण हजेरी',
      value: kpis.todayTotalAttendance,
      subtitle: `सकाळ: ${kpis.todayBreakfast} • दुपार: ${kpis.todayLunch} • रात्र: ${kpis.todayDinner}`,
      icon: CalendarCheck,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      link: '/admin/attendance',
    },
    {
      title: 'आजचे उत्पन्न',
      value: `₹${Number(kpis.todayRevenue || 0).toLocaleString('en-IN')}`,
      subtitle: 'आजची जमा रक्कम',
      icon: IndianRupee,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      link: '/admin/payments',
    },
    {
      title: 'एकूण बाकी रक्कम',
      value: `₹${Number(kpis.pendingPayments || 0).toLocaleString('en-IN')}`,
      subtitle: 'थकबाकी बिले',
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      link: '/admin/billing',
    },
    {
      title: 'सक्रिय सबस्क्रिप्शन',
      value: kpis.activeSubscriptions || kpis.activeCustomers,
      subtitle: 'वैध मासिक पास',
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      link: '/admin/subscriptions',
    },
    {
      title: 'संपणारी सबस्क्रिप्शन',
      value: kpis.expiringSubscriptions,
      subtitle: 'पुढील ७ दिवसांत संपणारे',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      link: '/admin/subscriptions',
    },
    {
      title: 'अतिरिक्त जेवण',
      value: kpis.totalExtraMeals || 0,
      subtitle: 'अतिरिक्त + पाहुणे ताट',
      icon: UtensilsCrossed,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      link: '/admin/extra-meals',
    },
  ];

  // Date Filter Pills
  const filterPills = [
    { id: 'today', name: 'आज' },
    { id: 'yesterday', name: 'काल' },
    { id: 'week', name: 'या आठवड्यात' },
    { id: 'month', name: 'या महिन्यात' },
    { id: 'last_month', name: 'मागील महिना' },
  ];

  return (
    <div className="space-y-7 font-sans">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            मेस व्यवसाय अवलोकन (Dashboard Overview)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • रिअल-टाईम हजेरी, महसूल आणि सबस्क्रिप्शन विश्लेषण
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold flex-wrap">
          <div className="px-2.5 py-1 text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">कालावधी:</span>
          </div>
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setDateFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilter === pill.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {pill.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Eight Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  {card.subtitle}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 5. Main Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Attendance Trend (7 Days) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                दैनंदिन हजेरी आलेख (Daily Attendance Trend)
              </h3>
              <p className="text-xs text-slate-400 font-medium">मागील ७ दिवसांमधील ग्राहक उपस्थिती</p>
            </div>
            <Link to="/admin/attendance" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              <span>हजेरी यादी पाहा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyAttendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} जेवणे`, 'एकूण हजेरी']}
                  labelFormatter={(label) => `वार: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#attBlue)"
                  name="हजेरी"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Status Ratio (Pie) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              ग्राहक स्थिती गुणोत्तर (Customer Ratio)
            </h3>
            <p className="text-xs text-slate-400 font-medium">सक्रिय वि. स्थगित वि. निष्क्रिय</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.activeVsInactive}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.activeVsInactive.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-semibold">सक्रिय: {kpis.activeCustomers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600 font-semibold">स्थगित: {kpis.pausedCustomers || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-semibold">बंद: {kpis.inactiveCustomers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Meal-wise Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                मासिक उत्पन्न आलेख (Monthly Revenue Trend)
              </h3>
              <p className="text-xs text-slate-400 font-medium">पडताळणी झालेले मासिक उत्पन्न (रुपये)</p>
            </div>
            <Link to="/admin/payments" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              <span>पेमेंट यादी</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} name="जमा उत्पन्न (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meal-Wise Today Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              आजची वेळनिहाय हजेरी (Meal-Wise Attendance)
            </h3>
            <p className="text-xs text-slate-400 font-medium">सकाळ, दुपार आणि रात्रीचे जेवण संख्या</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-orange-950">सकाळचा नाश्ता</div>
                  <div className="text-[10px] text-orange-700 font-medium">07:30 AM – 10:00 AM</div>
                </div>
              </div>
              <div className="text-xl font-black text-orange-700 font-mono">
                {kpis.todayBreakfast} <span className="text-xs font-bold">ताट</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">दुपारचे जेवण</div>
                  <div className="text-[10px] text-emerald-700 font-medium">12:00 PM – 03:00 PM</div>
                </div>
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                {kpis.todayLunch} <span className="text-xs font-bold">ताट</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-950">रात्रीचे जेवण</div>
                  <div className="text-[10px] text-blue-700 font-medium">07:30 PM – 10:30 PM</div>
                </div>
              </div>
              <div className="text-xl font-black text-blue-700 font-mono">
                {kpis.todayDinner} <span className="text-xs font-bold">ताट</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities & Audit Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">अलिकडील हजेरी नोंदी</h3>
            <Link to="/admin/attendance" className="text-xs font-bold text-blue-600 hover:underline">
              सर्व पाहा →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {activities?.recentAttendance?.map((att) => (
              <div key={att.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">{att.customer.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{att.customer.customerCode} • {att.date}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {att.mealType === 'BREAKFAST' ? 'नाश्ता' : att.mealType === 'LUNCH' ? 'दुपारचे' : 'रात्रीचे'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">अलिकडील पेमेंट नोंदी</h3>
            <Link to="/admin/payments" className="text-xs font-bold text-blue-600 hover:underline">
              सर्व पाहा →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {activities?.recentPayments?.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">{p.customer?.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{p.paymentNumber} • {p.paymentMethod}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 font-mono">₹{p.amount}</div>
                  <span className={`text-[10px] font-bold ${p.status === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {p.status === 'VERIFIED' ? '✓ मंजूर' : 'प्रलंबित'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
