import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  Receipt,
  Eye,
  FileText,
  AlertCircle,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const PaymentManagementPage = () => {
  const [stats, setStats] = useState({
    totalMonthlyCollection: 0,
    pendingPaymentAmount: 0,
    paidCustomersCount: 0,
    unpaidCustomersCount: 0,
    totalApprovedCustomers: 0,
    pendingVerificationsCount: 0,
  });
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'pendingVerification', 'history'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [recordModal, setRecordModal] = useState({
    open: false,
    customerId: '',
    invoiceId: '',
    amount: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    remarks: '',
  });

  const [billModal, setBillModal] = useState({
    open: false,
    invoice: null,
  });

  const [historyModal, setHistoryModal] = useState({
    open: false,
    customer: null,
    payments: [],
    invoices: [],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, paymentsRes, invoicesRes, customersRes] = await Promise.all([
        api.get('/payments/stats'),
        api.get('/payments?limit=50'),
        api.get('/invoices?limit=50'),
        api.get('/customers?limit=100'),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (paymentsRes?.data?.payments) setPayments(paymentsRes.data.payments);
      if (invoicesRes?.data?.invoices) setInvoices(invoicesRes.data.invoices);
      if (customersRes?.data?.customers) setCustomers(customersRes.data.customers);
    } catch (err) {
      toast.error('पेमेंट माहिती लोड करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Confirm Paid Action (Owner verifies and confirms payment)
  const handleConfirmPaid = async (paymentId) => {
    setActionLoading(true);
    try {
      await api.put(`/payments/${paymentId}/verify`, {
        status: 'VERIFIED',
        notes: 'मालकाद्वारे पेमेंट पडताळून PAID केले गेले',
      });
      toast.success('पेमेंट यशस्वीरीत्या प्रमाणित करण्यात आले! (Payment Verified as PAID)');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'प्रमाणीकरणात त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Payment Action
  const handleRejectPayment = async (paymentId) => {
    setActionLoading(true);
    try {
      await api.put(`/payments/${paymentId}/verify`, {
        status: 'REJECTED',
        notes: 'अवैध UTR किंवा स्क्रीनशॉटमुळे मालकाने पेमेंट नाकारले',
      });
      toast.success('पेमेंट नाकारण्यात आले.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'पेमेंट नाकारताना त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Invoice Paid / Unpaid Status
  const handleToggleInvoice = async (invoiceId, targetStatus) => {
    setActionLoading(true);
    try {
      await api.put(`/payments/invoice/${invoiceId}/status`, {
        status: targetStatus,
        remarks: `मालकाद्वारे ${targetStatus} चिन्हांकित केले`,
      });
      toast.success(`बिल स्थिती यशस्वीरीत्या '${targetStatus}' करण्यात आली.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'बिल स्थिती बदलताना त्रुटी.');
    } finally {
      setActionLoading(false);
    }
  };

  // Record Manual Cash / UPI Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!recordModal.customerId || !recordModal.amount || Number(recordModal.amount) <= 0) {
      toast.error('कृपया ग्राहक आणि योग्य रक्कम भरा.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/payments/manual-record', {
        customerId: recordModal.customerId,
        invoiceId: recordModal.invoiceId || null,
        amount: Number(recordModal.amount),
        paymentMethod: recordModal.paymentMethod,
        transactionRef: recordModal.transactionRef,
        remarks: recordModal.remarks,
      });
      toast.success('पेमेंट यशस्वीरीत्या नोंदवले व बिल अद्ययावत केले!');
      setRecordModal({
        open: false,
        customerId: '',
        invoiceId: '',
        amount: '',
        paymentMethod: 'CASH',
        transactionRef: '',
        remarks: '',
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'पेमेंट नोंदवताना त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  // View Customer Payment History
  const handleViewCustomerHistory = async (customerId) => {
    setActionLoading(true);
    try {
      const res = await api.get(`/payments/customer/${customerId}/history`);
      if (res?.data) {
        setHistoryModal({
          open: true,
          customer: res.data.customer,
          payments: res.data.payments,
          invoices: res.data.invoices,
        });
      }
    } catch (err) {
      toast.error('ग्राहक इतिहास लोड करताना त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'PENDING');

  const filteredInvoices = invoices.filter((inv) => {
    const cust = inv.customer;
    return (
      (cust?.name && cust.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cust?.phone && cust.phone.includes(searchTerm)) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D312E] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#205D48]" />
            <span>पेमेंट मॅनेजमेंट (Payment Management)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            मालकाने "Confirm Paid" केल्यानंतरच ग्राहकाला देयक PAID दिसते.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRecordModal({ ...recordModal, open: true })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#205D48] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#184837] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>रोख / UPI पेमेंट नोंदवा</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all shadow-xs"
            title="रिफ्रेश करा"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700">एकूण मासिक जमा (Collection)</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
            ₹{stats.totalMonthlyCollection.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">चालू महिन्यातील प्रमाणित रक्कम</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700">एकूण येणे बाकी (Pending Due)</div>
          <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1">
            ₹{stats.pendingPaymentAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ग्राहकांकडून येणे बाकी रक्कम</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700">सशुल्क ग्राहक (Paid)</div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 mt-1">
            {stats.paidCustomersCount} / {stats.totalApprovedCustomers}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">पूर्ण बिल भरलेले ग्राहक</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700">थकबाकीदार ग्राहक (Unpaid)</div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
            {stats.unpaidCustomersCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">बाकी देयक असलेले ग्राहक</div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'invoices' ? 'bg-[#205D48] text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>ग्राहक मासिक बिले ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pendingVerification')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pendingVerification'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>पडताळणी प्रलंबित ({pendingPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>सर्व पेमेंट इतिहास ({payments.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ग्राहकाचे नाव, मोबाइल नंबर किंवा बिल क्रमांकाने शोधा..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE3D2] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 shadow-xs"
        />
      </div>

      {/* TAB 1: INVOICES & BILLS LIST */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const isPartial = inv.status === 'PARTIALLY_PAID';

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl p-4 border border-[#EAE3D2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#205D48]/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900">{inv.customer?.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPartial
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPaid ? 'पूर्ण PAID' : isPartial ? 'अंशतः भरलेले' : 'UNPAID'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span>फोन: {inv.customer?.phone}</span>
                    <span>महिना: {inv.billingMonth}/{inv.billingYear}</span>
                    <span>एकूण: ₹{Number(inv.totalAmount)}</span>
                    <span className="font-bold text-rose-600">बाकी: ₹{Number(inv.balanceDue)}</span>
                  </div>
                </div>

                {/* Owner Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBillModal({ open: true, invoice: inv })}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    title="बिल तपशील पहा"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleViewCustomerHistory(inv.customerId)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    इतिहास
                  </button>

                  {!isPaid && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleToggleInvoice(inv.id, 'PAID')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      PAID करा
                    </button>
                  )}

                  {isPaid && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleToggleInvoice(inv.id, 'UNPAID')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                    >
                      UNPAID करा
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setRecordModal({
                        open: true,
                        customerId: inv.customerId,
                        invoiceId: inv.id,
                        amount: String(inv.balanceDue),
                        paymentMethod: 'CASH',
                        transactionRef: '',
                        remarks: `बिल ${inv.invoiceNumber} साठी रोख पेमेंट`,
                      })
                    }
                    className="px-3 py-1.5 bg-[#205D48] hover:bg-[#184837] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    पेमेंट जमा करा
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PENDING VERIFICATION REQUESTS */}
      {activeTab === 'pendingVerification' && (
        <div className="space-y-3">
          {pendingPayments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="font-bold text-slate-700 text-sm">सर्व पेमेंट प्रमाणित आहेत!</div>
              <p className="text-xs text-slate-400">सध्या कोणत्याही ग्राहकाचे पेमेंट पडताळणीसाठी प्रलंबित नाही.</p>
            </div>
          ) : (
            pendingPayments.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{p.customer?.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold">
                      {p.paymentNumber}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">₹{Number(p.amount)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span>पद्धत: {p.paymentMethod}</span>
                    {p.transactionRef && <span>UTR/Ref: {p.transactionRef}</span>}
                    <span>दिनांक: {new Date(p.createdAt).toLocaleDateString('mr-IN')}</span>
                  </div>
                  {p.notes && <div className="text-[11px] text-slate-600 mt-0.5 font-medium">नोंद: {p.notes}</div>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleConfirmPaid(p.id)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Paid (प्रमाणित करा)</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleRejectPayment(p.id)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>नाकारा</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ALL PAYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{p.customer?.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">{p.paymentNumber}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      p.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  {new Date(p.createdAt).toLocaleDateString('mr-IN')} • {p.paymentMethod} {p.transactionRef ? `• UTR: ${p.transactionRef}` : ''}
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-slate-900 text-sm">₹{Number(p.amount)}</div>
                <div className="text-[10px] text-slate-400">
                  {p.verifiedAt ? `प्रमाणित: ${new Date(p.verifiedAt).toLocaleDateString('mr-IN')}` : 'अद्याप अप्रमाणित'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Record Cash / UPI Payment */}
      {recordModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200"
          >
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#205D48]" />
              <span>रोख / UPI पेमेंट नोंदवा</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">ग्राहक निवडा</label>
              <select
                required
                value={recordModal.customerId}
                onChange={(e) => setRecordModal({ ...recordModal, customerId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white"
              >
                <option value="">-- ग्राहक निवडा --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerCode}) - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">रक्कम (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={recordModal.amount}
                  onChange={(e) => setRecordModal({ ...recordModal, amount: e.target.value })}
                  placeholder="उदा. 2500"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">पेमेंट पद्धत</label>
                <select
                  value={recordModal.paymentMethod}
                  onChange={(e) => setRecordModal({ ...recordModal, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-slate-50"
                >
                  <option value="CASH">रोख (CASH)</option>
                  <option value="UPI">UPI / ऑनलाइन</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">व्यवहार संदर्भ / UTR (पर्यायी)</label>
              <input
                type="text"
                value={recordModal.transactionRef}
                onChange={(e) => setRecordModal({ ...recordModal, transactionRef: e.target.value })}
                placeholder="उदा. 123456789012"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">नोंद / शेरा</label>
              <input
                type="text"
                value={recordModal.remarks}
                onChange={(e) => setRecordModal({ ...recordModal, remarks: e.target.value })}
                placeholder="उदा. मे महिन्याची पूर्ण फी मिळाली"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordModal({ ...recordModal, open: false })}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#205D48] hover:bg-[#184837] rounded-xl shadow-xs"
              >
                {actionLoading ? 'नोंद होत आहे...' : 'पेमेंट जमा करा'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Customer History */}
      {historyModal.open && historyModal.customer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{historyModal.customer.name}</h3>
                <p className="text-xs text-slate-500">
                  {historyModal.customer.customerCode} • {historyModal.customer.phone}
                </p>
              </div>
              <button
                onClick={() => setHistoryModal({ open: false, customer: null, payments: [], invoices: [] })}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 p-1"
              >
                बंद करा
              </button>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-700">पेमेंट नोंदी ({historyModal.payments.length})</div>
              {historyModal.payments.map((p) => (
                <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">₹{Number(p.amount)}</span> • {p.paymentMethod}
                    <div className="text-[10px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('mr-IN')} • {p.status}
                    </div>
                  </div>
                  {p.status === 'VERIFIED' && <span className="text-[10px] text-emerald-600 font-bold">प्रमाणित ✅</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
