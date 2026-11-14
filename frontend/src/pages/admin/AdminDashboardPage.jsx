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
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
          <span className="text-xs text-slate-400 font-medium">Fetching real-time mess metrics...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-72 bg-slate-200 rounded-2xl lg:col-span-2"></div>
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Dashboard Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const { kpis, charts, activities } = stats;

  const kpiCards = [
    { title: 'Total Customers', value: kpis.totalCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Members', value: kpis.activeCustomers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Inactive Members', value: kpis.inactiveCustomers, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: "Today's Total Scans", value: kpis.todayTotalAttendance, icon: CalendarCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Breakfast Attendance', value: kpis.todayBreakfast, icon: Coffee, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Lunch Attendance', value: kpis.todayLunch, icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Dinner Attendance', value: kpis.todayDinner, icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Monthly Revenue', value: `₹${Number(kpis.monthlyRevenue).toFixed(0)}`, icon: IndianRupee, color: 'text-emerald-700', bg: 'bg-emerald-100/70' },
    { title: 'Pending Dues', value: `₹${Number(kpis.pendingPayments).toFixed(0)}`, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Expiring in ≤ 7d', value: kpis.expiringSubscriptions, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      {/* 10 Dashboard KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {card.title}
                </span>
                <div className={`w-7 h-7 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Attendance Trend (7 Days) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Daily Attendance Trend (Last 7 Days)</h3>
              <p className="text-xs text-slate-400">Total customer scans broken down by day</p>
            </div>
            <Link to="/admin/attendance" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              <span>View Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyAttendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceColor)" name="Total Scans" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active vs Inactive Customer Pie */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Customer Membership Ratio</h3>
            <p className="text-xs text-slate-400">Active vs Paused vs Inactive</p>
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
            {charts.activeVsInactive.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue & Subscription Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend (6 Months) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Monthly Revenue Trend</h3>
              <p className="text-xs text-slate-400">Verified receipts in INR</p>
            </div>
            <Link to="/admin/payments" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              <span>View Payments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} name="Collections (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Active Plan Distribution</h3>
            <p className="text-xs text-slate-400">Current subscribers per plan</p>
          </div>

          <div className="space-y-3 pt-2">
            {charts.subscriptionDistribution.map((plan) => (
              <div key={plan.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{plan.name}</span>
                  <span className="font-extrabold text-emerald-600">{plan.count} subscribers</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${kpis.activeCustomers ? (plan.count / kpis.activeCustomers) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Scans */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Recent Attendance Scans</h4>
            <Link to="/admin/attendance" className="text-xs text-emerald-600 font-semibold hover:underline">All</Link>
          </div>
          <div className="space-y-3">
            {activities.recentAttendance.length > 0 ? (
              activities.recentAttendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{a.customer?.name}</div>
                    <div className="text-[10px] text-slate-400">{a.customer?.customerCode} • {a.mealType}</div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    {new Date(a.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No attendance scans recorded today.</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Recent Verified Payments</h4>
            <Link to="/admin/payments" className="text-xs text-emerald-600 font-semibold hover:underline">All</Link>
          </div>
          <div className="space-y-3">
            {activities.recentPayments.length > 0 ? (
              activities.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{p.customer?.name}</div>
                    <div className="text-[10px] text-slate-400">{p.paymentMethod} • {p.status}</div>
                  </div>
                  <span className="font-bold text-emerald-600">
                    ₹{Number(p.amount).toFixed(0)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No recent payments.</p>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Pending Extra Meals</h4>
            <Link to="/admin/extra-meals" className="text-xs text-emerald-600 font-semibold hover:underline">All</Link>
          </div>
          <div className="space-y-3">
            {activities.pendingExtraMeals.length > 0 ? (
              activities.pendingExtraMeals.map((em) => (
                <div key={em.id} className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{em.customer?.name}</div>
                    <div className="text-[10px] text-slate-400">{em.count}x {em.mealType} on {em.date}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                    Pending
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No pending extra meal requests.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
