import React, { useState, useEffect } from 'react';
import {
  Receipt,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  Clock,
  Sparkles,
  Download,
  Check,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerBillsPage = () => {
  const { user } = useAuth();
  const customer = user?.customer;

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/payments'),
      ]);
      if (invRes?.data?.invoices) setInvoices(invRes.data.invoices);
      if (payRes?.data?.payments) setPayments(payRes.data.payments);
    } catch (err) {
      toast.error('बिल व पेमेंट माहिती लोड करण्यात अडचण आली');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.balanceDue > 0 ? inv.balanceDue : inv.totalAmount));
    setTransactionRef('');
    setScreenshotFile(null);
    setPayModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('कृपया वैध पेमेंट रक्कम प्रविष्ट करा');
      return;
    }
    if (!transactionRef.trim()) {
      toast.error('कृपया UPI UTR / व्यवहार क्रमांक प्रविष्ट करा');
      return;
    }

    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append('invoiceId', selectedInvoice?.id || '');
      formData.append('amount', payAmount);
      formData.append('paymentMethod', 'UPI');
      formData.append('transactionRef', transactionRef.trim());
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      const res = await api.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.message || 'पेमेंट यशस्वीरित्या सादर केले! पडताळणी प्रलंबित आहे.');
      setPayModalOpen(false);
      fetchBillingData();
    } catch (err) {
      toast.error(err.message || 'पेमेंट सादर करण्यात त्रुटी आली');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.status !== 'PAID' ? Number(inv.balanceDue || 0) : 0), 0);
  const upiUrl = `upi://pay?pa=baramatimesswala@upi&pn=Baramaticha%20Dabewala&am=${payAmount || '100'}&cu=INR`;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            माझे मासिक बिल व UPI पेमेंट
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            मासिक स्टेटमेंट पाहा, अधिकृत PhonePe/BHIM द्वारे पैसे भरा आणि PDF बिल डाउनलोड करा
          </p>
        </div>

        {totalOutstanding > 0 && (
          <button
            type="button"
            onClick={() => {
              const unpaid = invoices.find((i) => i.status !== 'PAID') || invoices[0];
              if (unpaid) openPayModal(unpaid);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>थकबाकी भरा (₹{totalOutstanding.toLocaleString('en-IN')})</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">एकूण बाकी रक्कम</span>
          <div className={`text-2xl font-extrabold mt-1 ${totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalOutstanding > 0 ? 'कृपया लवकरात लवकर भरा' : 'सर्व बिले पूर्ण भरली आहेत'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">एकूण बिले संख्या</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{invoices.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">मासिक स्टेटमेंट्स जनरेट झाली</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">एकूण भरलेली रक्कम</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{payments.filter(p => p.status === 'VERIFIED').reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">यशस्वी जमा व्यवहार</div>
        </div>
      </div>

      {/* 1. Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">मासिक बिल स्टेटमेंट यादी</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">एकूण: {invoices.length} बिले</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400 font-bold space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>बिल माहिती लोड होत आहे...</p>
          </div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">बिल क्रमांक</th>
                  <th className="py-3.5 px-5">महिना</th>
                  <th className="py-3.5 px-5 text-right">एकूण रक्कम</th>
                  <th className="py-3.5 px-5 text-right">भरलेली रक्कम</th>
                  <th className="py-3.5 px-5 text-right">बाकी रक्कम</th>
                  <th className="py-3.5 px-5 text-center">स्थिती</th>
                  <th className="py-3.5 px-5 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {inv.billingMonth}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                      ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-emerald-600 font-bold">
                      ₹{Number(inv.paidAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-extrabold text-slate-900">
                      <span className={Number(inv.balanceDue) > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        ₹{Number(inv.balanceDue).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {inv.status === 'PAID' ? '✓ पूर्ण भरले' : inv.status === 'PARTIALLY_PAID' ? 'अंशतः बाकी' : 'थकबाकी'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      {/* PDF Download Link */}
                      <a
                        href={`/api/invoices/${inv.id}/pdf?token=${localStorage.getItem('token')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                        title="PDF बिल डाउनलोड करा"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>

                      {/* Pay Button */}
                      {Number(inv.balanceDue) > 0 && (
                        <button
                          type="button"
                          onClick={() => openPayModal(inv)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition-colors shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>पैसे भरा</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p>कोणतेही मासिक बिल स्टेटमेंट उपलब्ध नाही.</p>
          </div>
        )}
      </div>

      {/* 2. Payment History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">पेमेंट व जमा इतिहास (Payment Records)</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">एकूण: {payments.length} नोंदी</span>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">पेमेंट पावती क्र.</th>
                  <th className="py-3.5 px-5">रक्कम</th>
                  <th className="py-3.5 px-5">पद्धत</th>
                  <th className="py-3.5 px-5">व्यवहार क्रमांक (UTR)</th>
                  <th className="py-3.5 px-5">तारीख</th>
                  <th className="py-3.5 px-5 text-right">पडताळणी स्थिती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">{p.paymentNumber}</td>
                    <td className="py-3.5 px-5 font-bold text-emerald-600 font-mono text-sm">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {p.paymentMethod === 'UPI' ? 'ऑनलाइन UPI' : 'रोख (Cash)'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">{p.transactionRef || '-'}</td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {new Date(p.createdAt).toLocaleDateString('mr-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {p.status === 'VERIFIED' ? '✓ मंजूर (Verified)' : p.status === 'PENDING' ? '⏳ पडताळणी प्रलंबित' : 'नाकारले'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">अद्याप कोणतीही पेमेंट नोंद नाही.</div>
        )}
      </div>

      {/* Pay Modal with Official PhonePe / BHIM UPI Details */}
      {payModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">UPI द्वारे बिल भरा</h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Official QR Code Box */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>अधिकृत प्राप्तकर्ता: बारामतीचा डबेवाला</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                PhonePe, Google Pay, Paytm किंवा BHIM द्वारे स्कॅन करा
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto relative">
                <img
                  src="/baramaticha-dabewala-qr.png"
                  alt="Baramaticha Dabewala PhonePe BHIM UPI QR"
                  className="w-44 h-44 object-contain rounded-xl mx-auto shadow-xs"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <div style={{ display: 'none' }}>
                  <QRCodeSVG value={upiUrl} size={160} level="H" includeMargin={true} />
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-800">
                  खात्याचे नाव: <span className="text-emerald-700 font-extrabold">Baramaticha Dabewala</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  UPI ID: <span className="font-mono text-slate-700 font-bold">baramatimesswala@upi</span>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href={upiUrl}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>मोबाईल UPI अॅपमध्ये उघडा (Pay Now)</span>
                </a>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  भरलेली रक्कम (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  UPI UTR / व्यवहार क्रमांक (१२ अंकी) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. 432109876543"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  पेमेंट स्क्रीनशॉट (पर्यायी)
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-3 text-center cursor-pointer bg-slate-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshotFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{screenshotFile ? screenshotFile.name : 'स्क्रीनशॉट निवडा'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>सादर करत आहे...</span>
                    </>
                  ) : (
                    <>
                      <span>पेमेंट सादर करा (Submit Verification)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
