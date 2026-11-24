import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const BillingInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Batch Generation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search || undefined,
          limit: 30,
        },
      });
      if (res?.data?.invoices) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      toast.error('इनव्हॉइस माहिती लोड करण्यात अडचण आली');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search]);

  const handleGenerateBills = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/invoices/generate', {
        month: Number(month),
        year: Number(year),
        dueDate,
      });
      toast.success(res.message || 'मासिक बिलिंग यशस्वीरित्या तयार केले!');
      setModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'बिलिंग तयार करता आले नाही');
    } finally {
      setGenerating(false);
    }
  };

  const getMonthNameMarathi = (m) => {
    const months = [
      'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
      'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
    ];
    return months[m - 1] || `${m}`;
  };

  const handleSendWhatsApp = (inv) => {
    const rawPhone = inv.customer?.phone || '';
    const phone = rawPhone.replace(/\D/g, '');
    if (!phone) {
      toast.error('ग्राहकाचा मोबाईल नंबर उपलब्ध नाही');
      return;
    }
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const monthName = getMonthNameMarathi(inv.billingMonth);
    const text = `नमस्कार ${inv.customer?.name || 'सभासद'} जी,

बारामती मेसवाला कडून आपले ${monthName} ${inv.billingYear} चे मासिक मेस बिल:
📄 इनव्हॉइस क्र: ${inv.invoiceNumber}
💰 एकूण बिल: ₹${Number(inv.totalAmount).toLocaleString('en-IN')}
⚠️ बाकी रक्कम: ₹${Number(inv.balanceDue).toLocaleString('en-IN')}
📅 देय तारीख: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('mr-IN') : 'लवकरच'}

कृपया आपले बिल Google Pay / PhonePe (UPI) द्वारे किंवा मेस काऊंटरवर रोख भरून सहकार्य करावे.
धन्यवाद!
- बारामती मेसवाला`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>मासिक बिले व इनव्हॉइस (Billing & Invoices)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • मासिक मेस बिले (सबस्क्रिप्शन + अतिरिक्त जेवण), बाकी रक्कम व डिजिटल PDF पावत्या
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>मासिक बिले तयार करा</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="इनव्हॉइस क्र. किंवा सभासदाचे नाव..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">सर्व बिले (All)</option>
            <option value="PENDING">बाकी बिले (Pending)</option>
            <option value="PARTIALLY_PAID">अंशतः भरलेले (Partial)</option>
            <option value="PAID">पूर्ण भरलेले (Paid)</option>
            <option value="OVERDUE">मुदत संपलेले (Overdue)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500 font-medium">बिले लोड होत आहेत...</div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">इनव्हॉइस क्र.</th>
                  <th className="py-3 px-5">सभासदाचे नाव</th>
                  <th className="py-3 px-5">बिलिंग कालावधी</th>
                  <th className="py-3 px-5">योजना शुल्क</th>
                  <th className="py-3 px-5">अतिरिक्त जेवण</th>
                  <th className="py-3 px-5">एकूण देय</th>
                  <th className="py-3 px-5">बाकी रक्कम</th>
                  <th className="py-3 px-5">स्थिती</th>
                  <th className="py-3 px-5 text-right">PDF इनव्हॉइस</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{inv.customer?.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{inv.customer?.customerCode}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">
                      {getMonthNameMarathi(inv.billingMonth)} {inv.billingYear}
                    </td>
                    <td className="py-3.5 px-5">₹{Number(inv.subscriptionAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-5 text-slate-600">
                      ₹{(Number(inv.extraMealCharges) + Number(inv.guestMealCharges)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-rose-600">
                      ₹{Number(inv.balanceDue).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status === 'PAID' ? 'पूर्ण भरले' : inv.status === 'PARTIALLY_PAID' ? 'अंशतः भरले' : 'बाकी'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(inv)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold rounded-lg transition-colors cursor-pointer"
                          title="ग्राहकाला व्हॉट्सॲपवर बिल पाठवा"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>व्हॉट्सॲप</span>
                        </button>
                        <a
                          href={`/api/invoices/${inv.id}/pdf?token=${localStorage.getItem('messmate_token') || ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold rounded-lg transition-colors"
                          title="अधिकृत PDF इनव्हॉइस डाउनलोड करा"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF पावती</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">कोणतेही बिल आढळले नाही.</p>
          </div>
        )}
      </div>

      {/* Batch Generation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">मासिक बिले तयार करा (Run Billing)</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              सिस्टीम निवडलेल्या महिन्यासाठी सर्व सक्रिय सभासदांचे सबस्क्रिप्शन आणि मंजूर अतिरिक्त जेवणे मोजून आपोआप डिजिटल इनव्हॉइस तयार करेल.
            </p>

            <form onSubmit={handleGenerateBills} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">बिलिंग महिना</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {getMonthNameMarathi(m)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">वर्ष</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">बिल भरण्याची शेवटची तारीख</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
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
                  disabled={generating}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {generating ? 'बिलिंग प्रक्रिया चालू आहे...' : 'सर्व बिले तयार करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
