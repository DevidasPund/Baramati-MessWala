import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Utensils,
  CalendarCheck,
  CreditCard,
  Receipt,
  User,
  QrCode,
  Download,
  Maximize2,
  X,
  Check,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Phone,
  Wallet,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from URL query parameter or default to 'meals'
  // Tabs: 'meals', 'advance', 'attendance', 'bills'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    ['meals', 'advance', 'attendance', 'bills'].includes(tabFromUrl) ? tabFromUrl : 'meals'
  );

  useEffect(() => {
    if (tabFromUrl && ['meals', 'advance', 'attendance', 'bills'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);

  // Month and Year selector for Attendance & History
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Full Screen QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Pay Online UPI Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

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

  // Fetch Dashboard Stats from Backend (Secured by authenticated customer ID on server)
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
    totalAdvancePaid: 0,
  };
  const dailyRecords = statsData?.dailyRecords || [];
  const payments = statsData?.payments || [];
  const invoices = statsData?.invoices || [];
  const activeSub = statsData?.activeSubscription || customer?.subscriptions?.[0];
  const todayMenu = statsData?.todayMenu || [];
  const todayDabbas = statsData?.todayDabbas || [];
  const recentDabbas = statsData?.recentDabbas || [];

  // Subscription Remaining Days
  let daysLeft = 0;
  if (activeSub?.endDate) {
    const diff = new Date(activeSub.endDate).getTime() - new Date().getTime();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Customer Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'BM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(customer?.name);

  // Download Personal QR Code to PNG Canvas
  const handleDownloadQr = () => {
    const svg = document.getElementById('customer-dashboard-qr');
    if (!svg) {
      toast.error('QR कोड सापडला नाही');
      return;
    }
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${customer?.customerCode || 'Baramati_Messwala'}_QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR कोड गॅलरीमध्ये सेव्ह केला!');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error(e);
      toast.error('QR कोड डाऊनलोड करताना त्रुटी आली');
    }
  };

  // Submit Online Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('कृपया वैध रक्कम प्रविष्ट करा');
      return;
    }
    if (!transactionRef.trim()) {
      toast.error('कृपया UPI UTR / व्यवहार क्रमांक प्रविष्ट करा');
      return;
    }

    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append('amount', payAmount);
      formData.append('paymentMethod', 'UPI');
      formData.append('transactionRef', transactionRef.trim());
      if (selectedInvoice?.id) {
        formData.append('invoiceId', selectedInvoice.id);
      }
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      await api.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('पेमेंट नोंद यशस्वीरीत्या पाठवली! मालक पडताळणीनंतर खात्यात जमा होईल.');
      setPayModalOpen(false);
      setPayAmount('');
      setTransactionRef('');
      setScreenshotFile(null);
      setSelectedInvoice(null);
      // Refresh stats
      fetchDashboardStats(selectedMonth, selectedYear);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'पेमेंट नोंद करताना त्रुटी आली');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openPayModal = (invoice = null) => {
    setSelectedInvoice(invoice);
    if (invoice?.balanceDue) {
      setPayAmount(String(Number(invoice.balanceDue)));
    } else if (Number(kpis.outstandingBalance) > 0) {
      setPayAmount(String(Number(kpis.outstandingBalance)));
    } else {
      setPayAmount('1000');
    }
    setPayModalOpen(true);
  };

  // Monthly Attendance Calculations
  const totalAttendedDays = dailyRecords.filter((d) => d.attendedCount > 0).length;
  const totalCalculatedAmount = dailyRecords.reduce((acc, d) => acc + (d.amount || 0), 0);
  const totalMorningMeals = dailyRecords.filter((d) => d.sakal || d.lunch || d.breakfast).length;
  const totalEveningMeals = dailyRecords.filter((d) => d.sandhyakal || d.dinner).length;

  // Total Verified Advance Paid
  const totalAdvancePaid = payments
    .filter((p) => p.status === 'VERIFIED')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // Today Dabba Statuses
  const todayLunchDabba = todayDabbas.find((d) => d.mealType === 'LUNCH');
  const todayDinnerDabba = todayDabbas.find((d) => d.mealType === 'DINNER');

  const upiPayUrl = `upi://pay?pa=baramatimesswala@upi&pn=Baramaticha%20Messwala&am=${payAmount || '100'}&cu=INR`;

  return (
    <div className="space-y-5 sm:space-y-6 font-sans text-slate-800 pb-16 md:pb-6">
      {/* ========================================================================= */}
      {/* 1. CUSTOMER PROFILE CARD                                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Avatar with Initials + Profile Info */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-md shadow-blue-600/20">
                {initials}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                title="सक्रिय खाते"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  {customer?.name || 'सन्माननीय ग्राहक'}
                </h1>
                {/* Subscription Status Pill */}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{customer?.status === 'APPROVED' ? 'सक्रिय सदस्य' : customer?.status || 'सक्रिय'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-800">
                    {customer?.phone ? `+91 ${customer.phone}` : 'फोन उपलब्ध नाही'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">कोड:</span>{' '}
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {customer?.customerCode || 'BMW-MEMBER'}
                  </span>
                </div>
                <div className="text-slate-500">
                  <span className="text-slate-400">योजना:</span>{' '}
                  <span className="font-semibold text-slate-700">
                    {activeSub?.plan?.name || 'मासिक मेस योजना'}
                  </span>
                  {daysLeft > 0 && (
                    <span className="text-amber-600 font-bold ml-1">({daysLeft} दिवस शिल्लक)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Personal QR Quick Launch & Pay Action */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 min-h-[44px]"
            >
              <QrCode className="w-4 h-4" />
              <span>माझा QR कोड पहा</span>
            </button>

            {Number(kpis.outstandingBalance) > 0 && (
              <button
                onClick={() => openPayModal()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 min-h-[44px]"
              >
                <CreditCard className="w-4 h-4" />
                <span>UPI पैसे भरा</span>
              </button>
            )}

            <button
              onClick={() => fetchDashboardStats(selectedMonth, selectedYear)}
              disabled={loading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="माहिती रीफ्रेश करा"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CUSTOMER SUMMARY CARDS (4 CARDS)                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: 🍱 Total Meals Taken */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>🍱 एकूण घेतलेले जेवण</span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
              {kpis.totalMealsAttended}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">सर्व वेळ हजेरी नोंदी</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: 💰 Remaining Balance */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>💰 उर्वरित बाकी रक्कम</span>
            </div>
            <div
              className={`text-xl sm:text-3xl font-black mt-1 ${
                Number(kpis.outstandingBalance) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              ₹{Number(kpis.outstandingBalance).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {Number(kpis.outstandingBalance) > 0 ? 'मालक हिशोबानुसार देय' : 'सर्व देणी पूर्ण भरली ✅'}
            </div>
          </div>
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              Number(kpis.outstandingBalance) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: 📅 Attendance Days This Month */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>📅 चालू महिना उपस्थिती</span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-indigo-600 mt-1">
              {totalAttendedDays} <span className="text-xs sm:text-sm font-semibold text-slate-500">दिवस</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {marathiMonths.find((m) => m.num === selectedMonth)?.name} ({kpis.currentMonthMealsAttended} जेवणे)
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 4: 💸 Total Monthly Meal Charges */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>💸 एकूण मासिक मेस शुल्क</span>
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
              ₹{Number(kpis.monthlyTotalExpense).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">प्लॅन दर + अतिरिक्त जेवण</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PERSONAL CUSTOMER QR CODE DEDICATED CARD                               */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-blue-500/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-bold text-blue-100">
              <QrCode className="w-3.5 h-3.5" />
              <span>अधिकृत सभासद डायनिंग QR पास</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {customer?.name || 'माझा QR कोड'}
            </h2>
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-xl">
              मेस काऊंटरवर जेवणाच्या वेळी उपस्थिती नोंदवण्यासाठी हा वैयक्तिक QR कोड दाखवा. हा QR फक्त आपल्या अधिकृत खात्यासाठीच वैध असून यामध्ये कोणताही खाजगी डेटा उघड होत नाही.
            </p>
            <div className="flex items-center gap-2 pt-2 justify-center md:justify-start">
              <button
                onClick={() => setQrModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-98 rounded-xl text-xs font-black shadow-md transition-all min-h-[44px]"
              >
                <Maximize2 className="w-4 h-4" />
                <span>मोठा QR कोड दाखवा (Full Screen)</span>
              </button>
              <button
                onClick={handleDownloadQr}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-98 text-white rounded-xl text-xs font-bold border border-white/20 transition-all min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>QR डाउनलोड करा</span>
              </button>
            </div>
          </div>

          {/* Centered QR SVG Preview */}
          <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 cursor-pointer group" onClick={() => setQrModalOpen(true)}>
            {customer?.qrToken ? (
              <QRCodeSVG
                id="customer-dashboard-qr"
                value={customer.qrToken}
                size={130}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400 font-bold">
                QR तयार होत आहे...
              </div>
            )}
            <div className="text-[10px] text-center text-slate-500 font-mono font-bold mt-1.5 group-hover:text-blue-600">
              {customer?.customerCode || 'BMW-QR'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CUSTOMER NAVIGATION TABS (EXACT 4 TABS ONLY)                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 overflow-x-auto scrollbar-none gap-1">
          {/* Tab 1: 🍽️ दैनिक जेवण */}
          <button
            type="button"
            onClick={() => handleTabChange('meals')}
            className={`flex-1 min-w-[130px] min-h-[44px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'meals'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>🍽️ दैनिक जेवण</span>
          </button>

          {/* Tab 2: 💰 Advance History */}
          <button
            type="button"
            onClick={() => handleTabChange('advance')}
            className={`flex-1 min-w-[150px] min-h-[44px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'advance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💰 Advance History</span>
          </button>

          {/* Tab 3: 📅 Attendance */}
          <button
            type="button"
            onClick={() => handleTabChange('attendance')}
            className={`flex-1 min-w-[130px] min-h-[44px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>📅 Attendance</span>
          </button>

          {/* Tab 4: 🧾 Bills */}
          <button
            type="button"
            onClick={() => handleTabChange('bills')}
            className={`flex-1 min-w-[120px] min-h-[44px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'bills'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>🧾 Bills</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: 🍽️ दैनिक जेवण (DAILY MEALS)                                   */}
        {/* ===================================================================== */}
        {activeTab === 'meals' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Today's Dabba Status Section */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    आजची डबा स्थिती (Today's Dabba Status)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date().toLocaleDateString('mr-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Lunch Dabba */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">🌅 दुपारचा डबा (Lunch)</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        todayLunchDabba?.status === 'RETURNED'
                          ? 'bg-blue-100 text-blue-800'
                          : todayLunchDabba?.status === 'GIVEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {todayLunchDabba?.status === 'RETURNED'
                        ? 'डबा जमा ✅'
                        : todayLunchDabba?.status === 'GIVEN'
                        ? 'डबा स्वीकारला (हजेरी ✅)'
                        : 'द्यायचा बाकी'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {todayLunchDabba?.givenAt
                      ? `स्वीकार वेळ: ${new Date(todayLunchDabba.givenAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}`
                      : 'डबा स्वीकारल्यावर येथे नोंद दिसेल.'}
                  </div>
                </div>

                {/* Dinner Dabba */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">🌙 रात्रीचा डबा (Dinner)</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        todayDinnerDabba?.status === 'RETURNED'
                          ? 'bg-blue-100 text-blue-800'
                          : todayDinnerDabba?.status === 'GIVEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {todayDinnerDabba?.status === 'RETURNED'
                        ? 'डबा जमा ✅'
                        : todayDinnerDabba?.status === 'GIVEN'
                        ? 'डबा स्वीकारला (हजेरी ✅)'
                        : 'द्यायचा बाकी'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {todayDinnerDabba?.givenAt
                      ? `स्वीकार वेळ: ${new Date(todayDinnerDabba.givenAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}`
                      : 'डबा स्वीकारल्यावर येथे नोंद दिसेल.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Food Menu Section */}
            {todayMenu.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-blue-600" />
                    <span>आजचा विशेष मेस मेनू (Today's Menu)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {todayMenu.map((m) => (
                    <div key={m.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                        <span>{m.mealType === 'LUNCH' ? '🌅 दुपारचे जेवण' : '🌙 रात्रीचे जेवण'}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          तयार आहे
                        </span>
                      </div>
                      <div className="font-black text-sm text-slate-900">{m.title}</div>
                      <div className="text-xs text-slate-600">
                        {Array.isArray(m.items) ? m.items.join(' • ') : m.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Dabbas & Meals History */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>अलीकडील डबा व जेवण इतिहास (Recent Meal Logs)</span>
              </h3>

              {recentDabbas.length > 0 ? (
                <div className="space-y-2">
                  {recentDabbas.slice(0, 7).map((d) => (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{new Date(d.date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] font-mono text-slate-500">
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
                  सध्या कोणत्याही नोंदी उपलब्ध नाहीत.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: 💰 ADVANCE HISTORY (PAYMENT HISTORY)                          */}
        {/* ===================================================================== */}
        {activeTab === 'advance' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Advance Balance Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-800">एकूण ऍडव्हान्स जमा (Total Advance Paid)</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    ₹{totalAdvancePaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">अधिकृत पडताळणी झालेले पेमेंट</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">चालू उर्वरित बाकी (Remaining Balance)</div>
                  <div className={`text-2xl font-black mt-1 ${Number(kpis.outstandingBalance) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{Number(kpis.outstandingBalance).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {Number(kpis.outstandingBalance) > 0 ? 'मालक मंजुरीनुसार देय' : 'सर्व देणी पूर्ण भरली ✅'}
                  </div>
                </div>
                {Number(kpis.outstandingBalance) > 0 && (
                  <button
                    onClick={() => openPayModal()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    पैसे भरा
                  </button>
                )}
              </div>
            </div>

            {/* Advance History Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  ऍडव्हान्स पेमेंट नोंदी (Advance Payment Records)
                </h3>
                <span className="text-xs text-slate-400">एकूण {payments.length} नोंदी</span>
              </div>

              {payments.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b text-[11px]">
                      <tr>
                        <th className="py-3 px-3.5">तारीख</th>
                        <th className="py-3 px-3.5">पेमेंट पद्धत</th>
                        <th className="py-3 px-3.5">पावती / UTR संदर्भ</th>
                        <th className="py-3 px-3.5 text-right">जमा रक्कम</th>
                        <th className="py-3 px-3.5 text-right">उर्वरित बाकी</th>
                        <th className="py-3 px-3.5 text-center">स्थिती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 text-slate-900 font-semibold whitespace-nowrap">
                            {new Date(p.createdAt).toLocaleDateString('mr-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3.5 font-bold text-slate-800">
                            {p.paymentMethod === 'UPI' ? 'ऑनलाइन UPI' : p.paymentMethod === 'CASH' ? 'रोख (Cash)' : p.paymentMethod}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                            {p.transactionRef || p.paymentNumber || '-'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-black text-emerald-600 font-mono text-sm">
                            ₹{Number(p.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-700">
                            ₹{Number(p.remainingBalance || kpis.outstandingBalance).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5 text-center">
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
                                ? 'मंजूर ✅'
                                : p.status === 'PENDING'
                                ? 'पडताळणी प्रलंबित ⏳'
                                : 'नाकारले ✕'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>अद्याप कोणतीही ऍडव्हान्स पेमेंट नोंद उपलब्ध नाही.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: 📅 ATTENDANCE (MONTHLY ATTENDANCE & MEAL TABLE)                */}
        {/* ===================================================================== */}
        {activeTab === 'attendance' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Month & Year Selection Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  मासिक हजेरी व जेवण हिशोब (Monthly Attendance & Meal Records)
                </h3>
                <p className="text-xs text-slate-500">
                  फक्त आपल्या अधिकृत खात्यातील हजेरी व जेवणाची नोंद
                </p>
              </div>

              {/* Month and Year Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                >
                  {marathiMonths.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Metrics Bar for Selected Month */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">एकूण हजेरी दिवस</span>
                <span className="font-black text-slate-900 text-sm">{totalAttendedDays} दिवस</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">🌅 सकाळ उपस्थिती</span>
                <span className="font-black text-emerald-700 text-sm">{totalMorningMeals} वेळा</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">🌙 संध्याकाळ उपस्थिती</span>
                <span className="font-black text-indigo-700 text-sm">{totalEveningMeals} वेळा</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">एकूण हिशोब रक्कम</span>
                <span className="font-black text-blue-700 text-sm font-mono">₹{totalCalculatedAmount}</span>
              </div>
            </div>

            {/* Attendance & Meal Table (Exact 5 Columns Requested) */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">तारीख (Date)</th>
                    <th className="py-3 px-3.5 text-center">🌅 सकाळ (Breakfast)</th>
                    <th className="py-3 px-3.5 text-center">🌙 संध्याकाळ (Dinner)</th>
                    <th className="py-3 px-3.5 text-right">दर (Rate)</th>
                    <th className="py-3 px-3.5 text-right">रक्कम (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dailyRecords.length > 0 ? (
                    dailyRecords.map((d) => {
                      const isMorningTaken = Boolean(d.sakal || d.lunch || d.breakfast);
                      const isEveningTaken = Boolean(d.sandhyakal || d.dinner);

                      // Date formatting: e.g. "01 नोव्हेंबर 2026 (रविवार)"
                      const dateObj = new Date(d.date);
                      const formattedDate = dateObj.toLocaleDateString('mr-IN', {
                        day: '2-digit',
                        month: 'short',
                        weekday: 'short',
                      });

                      return (
                        <tr key={d.date} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          {/* 🌅 सकाळ (Breakfast / Lunch) */}
                          <td className="py-2.5 px-3.5 text-center">
                            {isMorningTaken ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                <span>उपस्थित</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                                <X className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                                <span>अनुपस्थित</span>
                              </span>
                            )}
                          </td>

                          {/* 🌙 संध्याकाळ (Dinner) */}
                          <td className="py-2.5 px-3.5 text-center">
                            {isEveningTaken ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                <span>उपस्थित</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                                <X className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                                <span>अनुपस्थित</span>
                              </span>
                            )}
                          </td>

                          {/* दर (Rate) */}
                          <td className="py-2.5 px-3.5 text-right font-mono text-slate-600">
                            ₹{d.rate}
                          </td>

                          {/* रक्कम (Amount) */}
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                            ₹{d.amount}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        निवडलेल्या महिन्यासाठी कोणतीही हजेरी नोंद आढळली नाही.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Table Footer: Automatically Calculated Total */}
                {dailyRecords.length > 0 && (
                  <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-black text-slate-900">
                    <tr>
                      <td className="py-3 px-3.5">
                        एकूण हिशोब ({dailyRecords.length} दिवस)
                      </td>
                      <td className="py-3 px-3.5 text-center text-emerald-700">
                        {totalMorningMeals} वेळा उपस्थित
                      </td>
                      <td className="py-3 px-3.5 text-center text-indigo-700">
                        {totalEveningMeals} वेळा उपस्थित
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-500">
                        एकूण देय:
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-blue-700 text-sm">
                        ₹{totalCalculatedAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: 🧾 BILLS (CUSTOMER BILLS & STATEMENT)                          */}
        {/* ===================================================================== */}
        {activeTab === 'bills' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  माझे मासिक बिल स्टेटमेंट (Customer Bills)
                </h3>
                <p className="text-xs text-slate-500">
                  मासिक मेस शुल्क, ऍडव्हान्स व देय बाकी तपशील
                </p>
              </div>

              {Number(kpis.outstandingBalance) > 0 && (
                <button
                  type="button"
                  onClick={() => openPayModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs min-h-[40px]"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>ऑनलाइन बिल भरा</span>
                </button>
              )}
            </div>

            {/* List of Invoices */}
            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          <span>{marathiMonths.find((m) => m.num === inv.billingMonth)?.name || 'मासिक'} {inv.billingYear} बिल</span>
                          <span className="font-mono text-xs text-slate-500">#{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          कालावधी: {new Date(inv.periodStart).toLocaleDateString('mr-IN')} ते {new Date(inv.periodEnd).toLocaleDateString('mr-IN')}
                        </div>
                      </div>

                      {/* Payment Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status === 'PAID'
                          ? 'पूर्ण भरले ✅ (PAID)'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'अंशतः बाकी ⚠️ (PARTIAL)'
                          : 'थकबाकी ⏳ (PENDING)'}
                      </span>
                    </div>

                    {/* Detailed Bill Grid (Exact Fields Requested) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      {/* Total Meal Charges */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-bold">एकूण मेस शुल्क</span>
                        <span className="font-black text-slate-900 text-sm font-mono mt-0.5 block">
                          ₹{Number(inv.totalAmount || inv.subscriptionAmount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">योजना शुल्क</span>
                      </div>

                      {/* Advance Paid */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-bold">ऍडव्हान्स जमा</span>
                        <span className="font-black text-emerald-600 text-sm font-mono mt-0.5 block">
                          ₹{Number(inv.paidAmount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-600">जमा रक्कम</span>
                      </div>

                      {/* Extra Meals */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-bold">अतिरिक्त जेवण</span>
                        <span className="font-black text-slate-800 text-sm font-mono mt-0.5 block">
                          ₹{Number(inv.extraMealCharges || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">एक्स्ट्रा डबे</span>
                      </div>

                      {/* Outstanding Amount */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-bold">उर्वरित देय बाकी</span>
                        <span className={`font-black text-sm font-mono mt-0.5 block ${Number(inv.balanceDue) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{Number(inv.balanceDue).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {Number(inv.balanceDue) > 0 ? 'भरणा बाकी' : 'शून्य बाकी'}
                        </span>
                      </div>
                    </div>

                    {/* Pay Button for Pending Balance */}
                    {Number(inv.balanceDue) > 0 && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => openPayModal(inv)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs min-h-[40px]"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>या बिलासाठी UPI पैसे भरा</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback Statement when Invoices are not yet generated */
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      चालू महिना बिल अंदाजपत्रक ({marathiMonths.find((m) => m.num === selectedMonth)?.name} {selectedYear})
                    </h4>
                    <p className="text-xs text-slate-500">औपचारिक बिल मालक तयार करतील, तोपर्यंत खालील अंदाज वैध आहे.</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                    चालू कालावधी
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">एकूण मेस शुल्क</span>
                    <span className="font-black text-slate-900 text-sm font-mono mt-0.5 block">
                      ₹{Number(kpis.monthlyTotalExpense).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">ऍडव्हान्स जमा</span>
                    <span className="font-black text-emerald-600 text-sm font-mono mt-0.5 block">
                      ₹{totalAdvancePaid.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">अतिरिक्त जेवण</span>
                    <span className="font-black text-slate-800 text-sm font-mono mt-0.5 block">
                      ₹0
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">उर्वरित देय बाकी</span>
                    <span className={`font-black text-sm font-mono mt-0.5 block ${Number(kpis.outstandingBalance) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{Number(kpis.outstandingBalance).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FULL SCREEN / ENLARGED QR CODE MODAL FOR MESS COUNTER SCANNING             */}
      {/* ========================================================================= */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                मेस काऊंटर स्कॅनिंग पास
              </span>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-900">{customer?.name}</h3>
              <p className="text-xs font-mono font-bold text-blue-600 tracking-wider">
                {customer?.customerCode} • +91 {customer?.phone}
              </p>
            </div>

            {/* High-Resolution QR */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 inline-block shadow-inner mx-auto">
              {customer?.qrToken ? (
                <QRCodeSVG
                  value={customer.qrToken}
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="w-60 h-60 flex items-center justify-center text-xs text-slate-400">
                  QR तयार होत आहे...
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-600 bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-left space-y-1">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>सूचना:</span>
              </div>
              <p className="text-slate-600 leading-tight">
                काऊंटरवर हा QR स्कॅनर समोर धरा. स्क्रीनचा ब्राइटनेस वाढवल्यास स्कॅनिंग जलद होते.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>गॅलरीमध्ये सेव्ह करा</span>
              </button>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs min-h-[44px]"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONLINE UPI BILL PAYMENT MODAL                                             */}
      {/* ========================================================================= */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">UPI द्वारे पैसे भरा</h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* UPI QR Display */}
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center space-y-2">
              <div className="text-xs font-bold text-blue-900">बारामती मेसवाला PhonePe / Google Pay / BHIM UPI</div>
              <div className="p-2 bg-white rounded-xl inline-block shadow-xs border">
                <QRCodeSVG value={upiPayUrl} size={150} level="H" includeMargin={true} />
              </div>
              <div className="text-xs">
                UPI ID: <span className="font-mono font-bold text-blue-700">baramatimesswala@upi</span>
              </div>
              <a
                href={upiPayUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>थेट मोबाईल UPI अ‍ॅप उघडा</span>
              </a>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">भरणा केलेली रक्कम (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="उदा. 1500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  UPI UTR / व्यवहार क्रमांक (१२ अंकी) *
                </label>
                <input
                  type="text"
                  required
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="उदा. 432109876543"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">स्क्रीनशॉट अपलोड (पर्यायी)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 min-h-[44px]"
                >
                  {submittingPayment ? 'नोंद होत आहे...' : 'पेमेंट नोंद सादर करा'}
                </button>
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs min-h-[44px]"
                >
                  रद्द करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerDashboardPage;
