import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  Plus,
  Filter,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Direct Payment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    invoiceId: '',
    amount: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    notes: 'मेस काउंटरवर रोख रक्कम प्राप्त',
  });

  // Screenshot viewer modal
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: { status: statusFilter !== 'ALL' ? statusFilter : undefined },
      });
      if (res?.data?.payments) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      toast.error('पेमेंट माहिती लोड करता आली नाही');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  useEffect(() => {
    Promise.all([
      api.get('/customers?limit=100'),
      api.get('/invoices?status=PENDING&limit=100'),
    ]).then(([custRes, invRes]) => {
      if (custRes?.data?.customers) {
        setCustomers(custRes.data.customers);
        if (custRes.data.customers.length > 0) {
          setPaymentForm((prev) => ({ ...prev, customerId: custRes.data.customers[0].id }));
        }
      }
      if (invRes?.data?.invoices) {
        setInvoices(invRes.data.invoices);
      }
    });
  }, []);

  const handleVerify = async (id, status) => {
    const statusText = status === 'VERIFIED' ? 'मंजूर' : 'नाकारणे';
    const notes = prompt(`या पेमेंटसाठी काही शेरा लिहायचा आहे का? (${statusText}):`);
    if (notes === null) return;

    try {
      const res = await api.put(`/payments/${id}/verify`, { status, notes });
      if (status === 'VERIFIED') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        toast.success('पेमेंट मंजूर झाले व इनव्हॉइस शिल्लक अपडेट झाली!');
      } else {
        toast.success('पेमेंट नाकारले गेले');
      }
      fetchPayments();
    } catch (err) {
      toast.error(err.message || 'कृती अयशस्वी झाली');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.customerId || !paymentForm.amount) {
      toast.error('कृपया ग्राहक आणि रक्कम निवडा');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payments', paymentForm);
      toast.success(res.message || 'पेमेंट यशस्वीरित्या नोंदवले गेले!');
      setModalOpen(false);
      setPaymentForm({
        customerId: customers[0]?.id || '',
        invoiceId: '',
        amount: '',
        paymentMethod: 'CASH',
        transactionRef: '',
        notes: '',
      });
      fetchPayments();
    } catch (err) {
      toast.error(err.message || 'पेमेंट नोंदवता आले नाही');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-blue-600" />
            <span>पेमेंट व्यवस्थापन व वसुली (Payments)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • ग्राहकांचे UPI ट्रान्झॅक्शन पडताळणी, UTR मंजुरी व काउंटर रोख नोंदणी
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>थेट पेमेंट नोंदवा</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">सर्व पेमेंट्स (All)</option>
            <option value="PENDING">पडताळणी बाकी (Pending Verification)</option>
            <option value="VERIFIED">मंजूर व जमा (Verified)</option>
            <option value="REJECTED">नाकारलेले (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500 font-medium">पेमेंट नोंदी लोड होत आहेत...</div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">पावती क्र.</th>
                  <th className="py-3 px-5">सभासदाचे नाव</th>
                  <th className="py-3 px-5">रक्कम</th>
                  <th className="py-3 px-5">पद्धत</th>
                  <th className="py-3 px-5">UTR / संदर्भ क्र.</th>
                  <th className="py-3 px-5">स्क्रीनशॉट पुरावा</th>
                  <th className="py-3 px-5">तारीख</th>
                  <th className="py-3 px-5">स्थिती</th>
                  <th className="py-3 px-5 text-right">पडताळणी कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{p.customer?.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.customer?.customerCode}</div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-emerald-600">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-700">{p.paymentMethod}</td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                      {p.transactionRef || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      {p.screenshotUrl ? (
                        <button
                          onClick={() => setPreviewScreenshot(p.screenshotUrl)}
                          className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>स्क्रीनशॉट पहा</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">उपलब्ध नाही</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString('mr-IN')}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {p.status === 'VERIFIED' ? 'मंजूर' : p.status === 'PENDING' ? 'पडताळणी बाकी' : 'नाकारले'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {p.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerify(p.id, 'VERIFIED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            मंजूर करा
                          </button>
                          <button
                            onClick={() => handleVerify(p.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            नाकारा
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">प्रक्रिया पूर्ण</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <IndianRupee className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">कोणतेही पेमेंट रेकॉर्ड आढळले नाही.</p>
          </div>
        )}
      </div>

      {/* Direct Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">थेट पेमेंट नोंदणी</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">ग्राहक *</label>
                <select
                  value={paymentForm.customerId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, customerId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">इनव्हॉइसशी जोडा (ऐच्छिक)</label>
                <select
                  value={paymentForm.invoiceId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">सामान्य पेमेंट / चालू खात्यात जमा</option>
                  {invoices
                    .filter((inv) => inv.customerId === paymentForm.customerId)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — बाकी: ₹{Number(inv.balanceDue).toLocaleString('en-IN')}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">रक्कम (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="3000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">पेमेंट पद्धत</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="CASH">काउंटरवर रोख (Cash)</option>
                    <option value="UPI">थेट UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">ट्रान्झॅक्शन / UTR क्रमांक (UPI असल्यास)</label>
                <input
                  type="text"
                  placeholder="उदा. 432109876543"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">शेरा / नोंद</label>
                <input
                  type="text"
                  placeholder="उदा. व्यवस्थापकाकडे रोख रक्कम जमा केली"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'नोंद होत आहे...' : 'पेमेंट जतन करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">पेमेंट स्क्रीनशॉट पुरावा</span>
              <button onClick={() => setPreviewScreenshot(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl border border-slate-200">
              <img src={previewScreenshot} alt="Payment Screenshot" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
