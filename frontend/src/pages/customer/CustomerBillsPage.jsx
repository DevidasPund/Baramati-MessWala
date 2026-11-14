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
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.balanceDue));
    setTransactionRef('');
    setScreenshotFile(null);
    setPayModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append('invoiceId', selectedInvoice?.id || '');
      formData.append('amount', payAmount);
      formData.append('paymentMethod', 'UPI');
      formData.append('transactionRef', transactionRef);
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      const res = await api.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.message || 'Payment submitted! Awaiting admin verification.');
      setPayModalOpen(false);
      fetchBillingData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const upiUrl = `upi://pay?pa=baramatimesswala@upi&pn=Baramaticha%20Dabewala&am=${payAmount || '100'}&cu=INR`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Monthly Bills & Invoices</h2>
        <p className="text-xs text-slate-500">View detailed statements, download PDFs, and clear dues via UPI</p>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Monthly Billing Invoices</h3>
          <span className="text-xs font-semibold text-slate-400">Total {invoices.length} Bills</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">Loading invoices...</div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-5">Period</th>
                  <th className="py-3 px-5">Sub Total</th>
                  <th className="py-3 px-5">Extra Meals</th>
                  <th className="py-3 px-5">Total Amount</th>
                  <th className="py-3 px-5">Balance Due</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {inv.billingMonth}/{inv.billingYear}
                    </td>
                    <td className="py-3.5 px-5">₹{Number(inv.subscriptionAmount).toFixed(0)}</td>
                    <td className="py-3.5 px-5 text-slate-600">
                      ₹{(Number(inv.extraMealCharges) + Number(inv.guestMealCharges)).toFixed(0)}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">₹{Number(inv.totalAmount).toFixed(0)}</td>
                    <td className="py-3.5 px-5 font-bold text-rose-600">₹{Number(inv.balanceDue).toFixed(0)}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {Number(inv.balanceDue) > 0 && (
                          <button
                            onClick={() => openPayModal(inv)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors"
                          >
                            Pay Due
                          </button>
                        )}
                        <a
                          href={`/api/invoices/${inv.id}/pdf?token=${localStorage.getItem('messmate_token') || ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs font-medium">No invoices generated yet.</div>
        )}
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Submitted Payment Receipts</h3>
          <span className="text-xs font-semibold text-slate-400">Total {payments.length} Payments</span>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Receipt #</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5">Ref / UTR</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3.5 px-5 font-bold text-emerald-600">₹{Number(p.amount).toFixed(0)}</td>
                    <td className="py-3.5 px-5">{p.paymentMethod}</td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">{p.transactionRef || '-'}</td>
                    <td className="py-3.5 px-5 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-5 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {p.status === 'VERIFIED' ? '✓ Verified' : p.status === 'PENDING' ? '⏳ Under Review' : 'Rejected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-10 text-xs text-slate-400">No payment records yet.</p>
        )}
      </div>

      {/* Pay Modal */}
      {payModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pay Bill via UPI</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Payee: Baramaticha Dabewala</span>
              </div>
              <p className="text-xs text-slate-500">Scan with PhonePe, Google Pay, Paytm, or BHIM</p>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto relative group">
                <img
                  src="/baramaticha-dabewala-qr.png"
                  alt="Baramaticha Dabewala PhonePe BHIM UPI QR"
                  className="w-44 h-44 object-contain rounded-xl mx-auto shadow-sm"
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
                  Payee: <span className="text-emerald-700 font-extrabold">Baramaticha Dabewala</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  UPI ID: <span className="font-mono text-slate-700 font-bold">baramatimesswala@upi</span>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href={upiUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Tap to Pay via UPI App</span>
                </a>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Paying Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">UPI UTR / Transaction Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 432109876543 (12 digits)"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Upload Payment Screenshot (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <strong>Important Note:</strong>
                <p>Your payment will be verified by the admin before your invoice balance is adjusted. Please keep your UPI reference handy.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submittingPayment ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
