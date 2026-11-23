import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  IndianRupee,
  AlertCircle,
  UserPlus,
  QrCode,
  UtensilsCrossed,
  Sun,
  Moon,
  Send,
  CreditCard,
  CheckCircle2,
  X,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ShoppingBag,
  Clock,
  ChevronRight,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Core State
  const [stats, setStats] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Attendance Chart Date Range State ('7d' | '14d' | '30d')
  const [attendanceRange, setAttendanceRange] = useState('7d');

  // Payment Recording Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Bulk Reminder State
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderToast, setReminderToast] = useState('');

  // 1. Format authentic Marathi date (e.g. "सोमवार, २४ नोव्हेंबर २०२६")
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

  // Relative Time Formatter in Marathi
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'आत्ताच';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} मिनिटांपूर्वी`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} तासांपूर्वी`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'काल';
    if (diffDays < 7) return `${diffDays} दिवसांपूर्वी`;

    return date.toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' });
  };

  // 2. Fetch Dashboard Metrics & Today's Menu
  const loadDashboardData = async (isManualRefresh = false, range = attendanceRange) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [statsRes, menuRes] = await Promise.all([
        api.get('/admin/dashboard-stats', { params: { attendanceRange: range } }),
        api.get('/menu/today').catch(() => ({ data: { menus: [] } })),
      ]);

      if (statsRes?.data) {
        setStats(statsRes.data);
      }

      if (menuRes?.data) {
        setMenuData(menuRes.data);
      }
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(err.message || 'डॅशबोर्ड डेटा लोड करताना समस्या आली.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(false, attendanceRange);
  }, [attendanceRange]);

  // Handle Date Range Change
  const handleRangeChange = (range) => {
    if (range === attendanceRange) return;
    setAttendanceRange(range);
  };

  // 3. Extract Today's Menu
  const getLunchItems = () => {
    const lunchMenu = menuData?.menus?.find((m) => m.mealType === 'LUNCH');
    if (lunchMenu?.items && Array.isArray(lunchMenu.items) && lunchMenu.items.length > 0) {
      return lunchMenu.items;
    }
    return null;
  };

  const getDinnerItems = () => {
    const dinnerMenu = menuData?.menus?.find((m) => m.mealType === 'DINNER');
    if (dinnerMenu?.items && Array.isArray(dinnerMenu.items) && dinnerMenu.items.length > 0) {
      return dinnerMenu.items;
    }
    return null;
  };

  // 4. Open Payment Modal for Outstanding Customer
  const handleOpenPaymentModal = (cust) => {
    setSelectedCustomer(cust);
    setPaymentAmount(cust.balanceDue?.toString() || '');
    setPaymentMethod('UPI');
    setPaymentRef('');
    setPaymentSuccessMsg('');
    setPaymentModalOpen(true);
  };

  // 5. Submit Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setPaymentSubmitting(true);

    try {
      await api.post('/payments', {
        customerId: selectedCustomer.customerId,
        invoiceId: selectedCustomer.id,
        amount: Number(paymentAmount),
        paymentMethod: paymentMethod,
        transactionId: paymentRef || `MANUAL-${Date.now()}`,
        status: 'VERIFIED',
      });

      setPaymentSuccessMsg('पेमेंट यशस्वीरीत्या नोंदवले गेले!');
      setTimeout(() => {
        setPaymentModalOpen(false);
        loadDashboardData(true, attendanceRange);
      }, 1200);
    } catch (err) {
      console.error('Payment record error:', err);
      alert(err.message || 'पेमेंट नोंदवताना त्रुटी आली.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // 6. Send Reminder to All Outstanding Customers
  const handleSendReminderToAll = async () => {
    setReminderSending(true);
    try {
      await api.post('/notifications/announcements', {
        title: 'मेस बिल थकबाकी स्मरणपत्र',
        message: 'कृपया आपली थकीत मेस रक्कम लवकरात लवकर भरावी ही नम्र विनंती. - बारामती मेसवाला',
        targetGroup: 'ALL',
      }).catch(() => null);

      setReminderToast('सर्व थकबाकी ग्राहकांना स्मरणपत्र पाठवले गेले!');
      setTimeout(() => setReminderToast(''), 4000);
    } catch (err) {
      console.error('Reminder error:', err);
    } finally {
      setReminderSending(false);
    }
  };

  // Loading Skeleton
  if (loading && !stats) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-10 w-72 bg-stone-200/70 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-[#EAE3D2] p-5 animate-pulse shadow-xs" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-[#EAE3D2] p-4 animate-pulse shadow-xs" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-white rounded-2xl border border-[#EAE3D2] animate-pulse" />
          <div className="lg:col-span-4 h-80 bg-white rounded-2xl border border-[#EAE3D2] animate-pulse" />
        </div>
      </div>
    );
  }

  // Error State
  if (error && !stats) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-[#EAE3D2] shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#2D312E]">डॅशबोर्ड माहिती उपलब्ध नाही</h3>
        <p className="text-xs text-stone-500 max-w-md">{error}</p>
        <button
          onClick={() => loadDashboardData(true, attendanceRange)}
          className="px-5 py-2.5 bg-[#205D48] hover:bg-[#184838] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          पुन्हा प्रयत्न करा
        </button>
      </div>
    );
  }

  const { kpis, alerts } = stats || {};
  const lunchItems = getLunchItems();
  const dinnerItems = getDinnerItems();
  const outstandingList = stats?.outstandingCustomers || [];
  const attendanceTrendData = stats?.charts?.dailyAttendanceTrend || [];
  const revenueTrendData = stats?.charts?.revenueTrend || [];
  const activityFeed = stats?.activities?.feed || [];

  // Check active alerts
  const hasPendingApprovals = alerts?.pendingApprovals?.count > 0;
  const hasOutstandingDue = (kpis?.pendingPayments || 0) > 0;
  const hasExpiringSubs = (kpis?.expiringSubscriptions || 0) > 0;
  const hasActiveAlerts = hasPendingApprovals || hasOutstandingDue || hasExpiringSubs;

  return (
    <div className="space-y-6 sm:space-y-7 font-sans pb-12">
      {/* Toast Notification */}
      {reminderToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#205D48] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold animate-bounce border border-emerald-400/40">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#2D312E] tracking-tight">
              नमस्कार, {user?.name || 'अॅडमिन'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-[#205D48] border border-emerald-200">
              <Sparkles className="w-3 h-3 text-[#205D48]" />
              प्रशासक
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-semibold mt-1 flex items-center gap-2">
            <span>{getMarathiDate()}</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-600">बारामती मेसवाला डॅशबोर्ड</span>
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDashboardData(true, attendanceRange)}
            disabled={refreshing}
            className="p-2.5 text-stone-600 bg-white hover:bg-stone-50 rounded-xl border border-[#EAE3D2] shadow-2xs transition-all disabled:opacity-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="डेटा रिफ्रेश करा"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#205D48]' : ''}`} />
          </button>

          <Link
            to="/admin/customers?action=new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#205D48] hover:bg-[#184838] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ नवीन ग्राहक</span>
          </Link>

          <Link
            to="/admin/qr-scanner"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-[#205D48] border border-[#205D48] text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all min-h-[44px]"
          >
            <QrCode className="w-4 h-4" />
            <span>QR स्कॅन करा</span>
          </Link>
        </div>
      </div>

      {/* 2. Admin Alerts Banner (Rendered ONLY when real records require attention) */}
      {hasActiveAlerts && (
        <div className="space-y-2.5">
          {hasPendingApprovals && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-amber-950">
                    {alerts.pendingApprovals.count} नवीन ग्राहकांची पडताळणी प्रलंबित आहे
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    ग्राहकांना लॉगिन व हजेरीसाठी मालकाची थेट मंजुरी आवश्यक आहे.
                  </div>
                </div>
              </div>
              <Link
                to="/admin/customer-verification"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0 shadow-2xs min-h-[40px]"
              >
                <span>पडताळणी करा</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {hasExpiringSubs && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/90 border border-blue-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-200/70 text-blue-900 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-blue-950">
                    {kpis?.expiringSubscriptions} ग्राहकांचे सबस्क्रिप्शन पुढील ७ दिवसांत संपत आहे
                  </div>
                  <div className="text-[11px] text-blue-800 font-medium">
                    ग्राहकांना नूतनीकरणाची आठवण करून द्या किंवा प्लॅन रीन्यू करा.
                  </div>
                </div>
              </div>
              <Link
                to="/admin/subscriptions"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0 shadow-2xs min-h-[40px]"
              >
                <span>सबस्क्रिप्शन तपासा</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {hasOutstandingDue && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-50/90 border border-orange-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-200/70 text-orange-950 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#8C3B14]" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-[#8C3B14]">
                    एकूण ₹{Number(kpis?.pendingPayments || 0).toLocaleString('en-IN')} थकबाकी येणे बाकी आहे
                  </div>
                  <div className="text-[11px] text-orange-800 font-medium">
                    {kpis?.pendingCustomersCount || outstandingList.length} ग्राहकांचे मासिक देयक प्रलंबित आहे.
                  </div>
                </div>
              </div>
              <Link
                to="/admin/payment-management"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C3B14] hover:bg-[#722f0f] text-white text-xs font-bold transition-colors shrink-0 shadow-2xs min-h-[40px]"
              >
                <span>पेमेंट मॅनेजमेंट</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 3. Four Core Summary Cards (Consistent Heights, Clickable, Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: एकूण सक्रिय ग्राहक */}
        <Link
          to="/admin/customers"
          className="bg-white rounded-2xl border border-[#EAE3D2] p-4 sm:p-5 shadow-xs hover:border-[#205D48] hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">एकूण सक्रिय ग्राहक</span>
            <div className="w-9 h-9 rounded-xl bg-[#205D48]/10 text-[#205D48] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[#2D312E] tracking-tight">
              {kpis?.activeCustomers ?? kpis?.totalApprovedCustomers ?? 0}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-stone-400 font-semibold">
              <span>मंजूर: {kpis?.totalApprovedCustomers || 0} सदस्य</span>
              <span className="text-[#205D48] font-bold group-hover:translate-x-0.5 transition-transform">पहा →</span>
            </div>
          </div>
        </Link>

        {/* KPI 2: आजची हजेरी */}
        <Link
          to="/admin/attendance"
          className="bg-white rounded-2xl border border-[#EAE3D2] p-4 sm:p-5 shadow-xs hover:border-[#205D48] hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">आजची हजेरी</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4.5 h-4.5 text-[#205D48]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[#2D312E] tracking-tight">
              {kpis?.todayAttendance ?? kpis?.todayTotalAttendance ?? 0}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-stone-500 font-semibold">
              <span>दुपारी: {kpis?.todayLunch || 0} | रात्री: {kpis?.todayDinner || 0}</span>
              <span className="text-[#205D48] font-bold group-hover:translate-x-0.5 transition-transform">तपशील →</span>
            </div>
          </div>
        </Link>

        {/* KPI 3: या महिन्याची कमाई */}
        <Link
          to="/admin/billing"
          className="bg-white rounded-2xl border border-[#EAE3D2] p-4 sm:p-5 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">या महिन्याची कमाई</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4.5 h-4.5 text-[#205D48]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight">
              ₹{Number(kpis?.monthlyCollection || kpis?.monthlyRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-stone-400 font-semibold">
              <span>प्रमाणित महसूल</span>
              <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">बिलिंग →</span>
            </div>
          </div>
        </Link>

        {/* KPI 4: थकबाकी */}
        <Link
          to="/admin/payment-management"
          className="bg-[#FFF4ED] rounded-2xl border border-[#FADCD0] p-4 sm:p-5 shadow-xs hover:border-orange-500 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C3B14]">थकबाकी (येणे बाकी)</span>
            <div className="w-9 h-9 rounded-xl bg-[#F6D3C1] text-[#8C3B14] flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4.5 h-4.5 text-[#8C3B14]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[#8C3B14] tracking-tight">
              ₹{Number(kpis?.pendingPayments || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-[#A74E21] font-bold">
              <span>{kpis?.pendingCustomersCount || outstandingList.length} ग्राहकांकडे बाकी</span>
              <span className="group-hover:translate-x-0.5 transition-transform">वसूली →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* 4. Prominent Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Quick 1: QR स्कॅन करा */}
        <Link
          to="/admin/qr-scanner"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#EAE3D2] shadow-xs hover:border-[#205D48] hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#205D48]/10 text-[#205D48] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#205D48] group-hover:text-white transition-all">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs sm:text-sm text-[#2D312E] truncate">QR स्कॅन करा</div>
            <div className="text-[10px] text-stone-500 truncate">उपस्थिती नोंदवा</div>
          </div>
        </Link>

        {/* Quick 2: नवीन ग्राहक */}
        <Link
          to="/admin/customers?action=new"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#EAE3D2] shadow-xs hover:border-blue-600 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs sm:text-sm text-[#2D312E] truncate">नवीन ग्राहक</div>
            <div className="text-[10px] text-stone-500 truncate">नोंदणी करा</div>
          </div>
        </Link>

        {/* Quick 3: पेमेंट तपासा */}
        <Link
          to="/admin/payment-management"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#EAE3D2] shadow-xs hover:border-purple-600 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs sm:text-sm text-[#2D312E] truncate">पेमेंट तपासा</div>
            <div className="text-[10px] text-stone-500 truncate">पावती व थकबाकी</div>
          </div>
        </Link>

        {/* Quick 4: आजचा मेनू अपडेट करा */}
        <Link
          to="/admin/menu"
          className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#EAE3D2] shadow-xs hover:border-[#EA8A27] hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#EA8A27] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#EA8A27] group-hover:text-white transition-all">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs sm:text-sm text-[#2D312E] truncate">आजचा मेनू अपडेट करा</div>
            <div className="text-[10px] text-stone-500 truncate">दुपार / रात्रीचे जेवण</div>
          </div>
        </Link>
      </div>

      {/* 5. Middle Analytics & Menu Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trends Chart (8/12 on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EAE3D2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F5EFE6]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#2D312E]">
                    दैनिक उपस्थिती अहवाल (Attendance)
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#205D48]">
                    लाइव्ह
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">
                  दुपारचे व रात्रीचे जेवण तुलना • चालू महिन्यात एकूण:{' '}
                  <span className="text-[#205D48] font-black">{kpis?.currentMonthAttendance || 0}</span> हजेरी
                </p>
              </div>

              {/* Date Range Selection Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#FAF6ED] rounded-xl border border-[#EAE3D2] self-start sm:self-auto">
                {[
                  { key: '7d', label: '७ दिवस' },
                  { key: '14d', label: '१४ दिवस' },
                  { key: '30d', label: '३० दिवस' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleRangeChange(tab.key)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      attendanceRange === tab.key
                        ? 'bg-[#205D48] text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-5 text-xs font-bold pt-3 pb-2 text-stone-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#059669]" />
                <span>दुपारचे जेवण (Lunch)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#205D48]" />
                <span>रात्रीचे जेवण (Dinner)</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceTrendData}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5EFE6" />
                <XAxis
                  dataKey="dayLabel"
                  axisLine={{ stroke: '#EAE3D2' }}
                  tickLine={false}
                  tick={{ fill: '#4A5568', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#718096', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(32, 93, 72, 0.05)' }}
                  formatter={(val, name) => [
                    `${val} सदस्य`,
                    name === 'lunch' ? 'दुपारचे जेवण' : (name === 'dinner' ? 'रात्रीचे जेवण' : name),
                  ]}
                  labelFormatter={(lbl, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `तारीख: ${item.date} (${item.marathiDay})` : lbl;
                  }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#EAE3D2',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="lunch" name="दुपारचे जेवण" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="dinner" name="रात्रीचे जेवण" fill="#205D48" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Menu Card (4/12 on desktop) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAE3D2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#205D48]/10 text-[#205D48] flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#2D312E]">आजचा मेनू</h2>
              </div>
              <Link
                to="/admin/menu"
                className="text-xs font-bold text-[#205D48] hover:underline"
              >
                व्यवस्थापित करा →
              </Link>
            </div>

            <div className="space-y-3.5 pt-4">
              {/* दुपारचे जेवण */}
              <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#EAE3D2]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#205D48]">
                    <Sun className="w-4 h-4 text-[#EA8A27]" />
                    <span>दुपारचे जेवण (Lunch)</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-semibold">१२:०० - ०३:००</span>
                </div>
                {lunchItems ? (
                  <ul className="space-y-1.5 pl-1">
                    {lunchItems.map((item, idx) => (
                      <li key={idx} className="text-xs font-semibold text-[#2D312E] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EA8A27]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-stone-500 italic py-1">
                    आजचा दुपारचा मेनू अजून नोंदवलेला नाही.
                  </div>
                )}
              </div>

              {/* रात्रीचे जेवण */}
              <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#EAE3D2]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#205D48]">
                    <Moon className="w-4 h-4 text-[#205D48]" />
                    <span>रात्रीचे जेवण (Dinner)</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-semibold">०७:३० - १०:३०</span>
                </div>
                {dinnerItems ? (
                  <ul className="space-y-1.5 pl-1">
                    {dinnerItems.map((item, idx) => (
                      <li key={idx} className="text-xs font-semibold text-[#2D312E] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#205D48]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-stone-500 italic py-1">
                    आजचा रात्रीचा मेनू अजून नोंदवलेला नाही.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <Link
              to="/admin/menu"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#205D48] hover:bg-[#184838] text-white text-xs font-bold rounded-xl shadow-xs transition-colors min-h-[44px]"
            >
              <span>मेनू बदला / नवीन डिश जोडा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Revenue vs Pending Chart & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Comparison Chart (7/12) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAE3D2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#2D312E]">
                  मासिक महसूल तुलना (Revenue vs Pending)
                </h2>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">
                  जमा महसूल विरुद्ध येणे बाकी थकबाकी (मागील ६ महिने)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-stone-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#205D48]" />
                  <span>जमा (Collected)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#EA580C]" />
                  <span>थकबाकी (Pending)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueTrendData}
                margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5EFE6" />
                <XAxis
                  dataKey="monthMarathi"
                  axisLine={{ stroke: '#EAE3D2' }}
                  tickLine={false}
                  tick={{ fill: '#4A5568', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#718096', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(32, 93, 72, 0.05)' }}
                  formatter={(val, name) => [
                    `₹${Number(val).toLocaleString('en-IN')}`,
                    name === 'collected' ? 'जमा रक्कम' : 'येणे बाकी',
                  ]}
                  labelFormatter={(lbl, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `महिना: ${item.label}` : lbl;
                  }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#EAE3D2',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="collected" name="जमा रक्कम" fill="#205D48" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="pending" name="येणे बाकी" fill="#EA580C" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Recent Activity Feed (5/12) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EAE3D2] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#205D48]/10 text-[#205D48] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#2D312E]">
                  अलीकडील घडामोडी (Recent Activity)
                </h2>
              </div>
              <span className="text-[11px] font-bold text-stone-400">रिअल-टाइम</span>
            </div>

            {/* Activity List */}
            <div className="divide-y divide-[#F5EFE6] pt-1">
              {activityFeed.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  सध्या कोणतीही नवीन हालचाल नोंदवलेली नाही.
                </div>
              ) : (
                activityFeed.slice(0, 6).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          item.badgeColor === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : item.badgeColor === 'emerald'
                            ? 'bg-emerald-100 text-[#205D48]'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {item.type === 'CUSTOMER_REGISTRATION' ? (
                          <UserPlus className="w-4 h-4" />
                        ) : item.type === 'PAYMENT_RECEIVED' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#2D312E] truncate">
                          {item.name} {item.code ? `(${item.code})` : ''}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium truncate">
                          {item.title} • {item.details}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-stone-400 font-semibold">
                        {formatTimeAgo(item.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F5EFE6]">
            <Link
              to="/admin/reports"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#205D48] hover:text-[#184838] transition-colors"
            >
              <span>सर्व अहवाल व इतिहास पहा</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 7. Bottom Section: Outstanding Invoices Table & Quick Payment Recording */}
      <div className="bg-white rounded-2xl border border-[#EAE3D2] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F5EFE6]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#2D312E]">
                थकबाकी असलेले ग्राहक (Outstanding Due)
              </h2>
              {outstandingList.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-[#8C3B14] font-black">
                  {outstandingList.length} सदस्य
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">
              थकीत रक्कम असलेल्या सदस्यांची थेट यादी व पेमेंट नोंदणी
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSendReminderToAll}
              disabled={reminderSending || outstandingList.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 text-[#205D48] border border-[#205D48] text-xs font-bold rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer min-h-[40px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{reminderSending ? 'पाठवत आहे...' : 'सर्वांना स्मरण पाठवा'}</span>
            </button>

            <Link
              to="/admin/payment-management"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#205D48] hover:bg-[#184838] text-white text-xs font-bold rounded-xl shadow-xs transition-all min-h-[40px]"
            >
              <span>सर्व पेमेंट व्यवस्थापित करा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Outstanding Table */}
        {outstandingList.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-85" />
            <p className="text-sm font-bold text-stone-700">सध्या कोणाचीही थकबाकी शिल्लक नाही!</p>
            <p className="text-xs text-stone-400 mt-0.5">सर्व ग्राहकांनी मेसचे पेमेंट वेळेवर भरले आहे.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F5EFE6] text-stone-500 font-bold">
                  <th className="py-3 px-3">ग्राहकाचे नाव व कोड</th>
                  <th className="py-3 px-3">प्लॅन</th>
                  <th className="py-3 px-3">देय तारीख</th>
                  <th className="py-3 px-3">बाकी रक्कम</th>
                  <th className="py-3 px-3 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {outstandingList.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#FAF6ED]/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#2D312E]">{cust.customerName}</div>
                      <div className="text-[11px] text-stone-400 font-mono">
                        {cust.customerCode} • {cust.phone || 'फोन उपलब्ध नाही'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold text-[11px]">
                        {cust.planName}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-stone-500 font-medium">
                        {cust.dueDate ? new Date(cust.dueDate).toLocaleDateString('mr-IN') : 'तात्काळ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-[#FFF2E8] text-[#8C3B14] border border-[#FADCD0] font-black text-xs font-mono">
                        ₹{Number(cust.balanceDue || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenPaymentModal(cust)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#205D48] hover:bg-[#184838] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer min-h-[36px]"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>पेमेंट जमा करा</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 8. Payment Recording Modal */}
      {paymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#EAE3D2] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]">
              <div>
                <h3 className="text-base font-bold text-[#2D312E]">पेमेंट नोंदणी (Record Payment)</h3>
                <p className="text-xs text-stone-500 font-semibold">
                  {selectedCustomer.customerName} ({selectedCustomer.customerCode})
                </p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#205D48] mx-auto animate-bounce" />
                <h4 className="font-bold text-[#205D48] text-sm">{paymentSuccessMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#EAE3D2] flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-semibold">एकूण थकीत रक्कम:</span>
                  <span className="text-[#8C3B14] font-black text-sm">
                    ₹{Number(selectedCustomer.balanceDue || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    जमा रक्कम (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedCustomer.balanceDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D2] focus:border-[#205D48] focus:ring-1 focus:ring-[#205D48] text-sm font-bold text-[#2D312E] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पेमेंट पद्धत *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D2] focus:border-[#205D48] focus:ring-1 focus:ring-[#205D48] text-xs font-semibold text-[#2D312E] outline-hidden bg-white"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm / QR)</option>
                    <option value="CASH">रोख रक्कम (Cash)</option>
                    <option value="BANK_TRANSFER">बँक ट्रान्सफर (NEFT / IMPS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    व्यवहार क्रमांक / संदर्भ (पर्यायी)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. UPI-12345678 किंवा पावती क्र."
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D2] focus:border-[#205D48] text-xs text-[#2D312E] outline-hidden"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[44px]"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="flex-1 py-2.5 px-4 bg-[#205D48] hover:bg-[#184838] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
                  >
                    {paymentSubmitting ? 'नोंदवत आहे...' : 'पेमेंट जमा करा'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
