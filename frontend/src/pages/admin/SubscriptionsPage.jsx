import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Clock,
  PauseCircle,
  PlayCircle,
  RotateCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expiringSoon, setExpiringSoon] = useState(false);

  // Assign Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState({
    customerId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    discount: 0,
    initialPaymentMethod: 'UPI',
  });

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          expiringSoon: expiringSoon ? 'true' : undefined,
          limit: 30,
        },
      });
      if (res?.data?.subscriptions) {
        setSubscriptions(res.data.subscriptions);
      }
    } catch (err) {
      toast.error('सबस्क्रिप्शन यादी लोड करता आली नाही');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, expiringSoon]);

  useEffect(() => {
    Promise.all([
      api.get('/subscriptions/plans'),
      api.get('/customers?limit=100'),
    ]).then(([plansRes, custRes]) => {
      if (plansRes?.data?.plans) {
        setPlans(plansRes.data.plans);
        if (plansRes.data.plans.length > 0) {
          setAssignForm((prev) => ({ ...prev, planId: plansRes.data.plans[0].id }));
        }
      }
      if (custRes?.data?.customers) {
        setCustomers(custRes.data.customers);
        if (custRes.data.customers.length > 0) {
          setAssignForm((prev) => ({ ...prev, customerId: custRes.data.customers[0].id }));
        }
      }
    });
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.customerId || !assignForm.planId) {
      toast.error('कृपया ग्राहक आणि योजना निवडा');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/subscriptions/assign', assignForm);
      toast.success(res.message || 'योजना यशस्वीरित्या सक्रिय केली!');
      setModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message || 'योजना जोडता आली नाही');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (id, name) => {
    const notes = prompt(`${name} चे सबस्क्रिप्शन स्थगित (Pause) करायचे आहे का? काही शेरा लिहा:`);
    if (notes === null) return;
    try {
      await api.put(`/subscriptions/${id}/pause`, { notes });
      toast.success('सबस्क्रिप्शन स्थगित केले');
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message || 'स्थगित करता आले नाही');
    }
  };

  const handleResume = async (id, name) => {
    if (!window.confirm(`${name} चे सबस्क्रिप्शन पूर्ववत (Resume) सुरू करायचे आहे का? शिल्लक दिवसांनुसार समाप्ती तारीख वाढवली जाईल.`)) return;
    try {
      const res = await api.put(`/subscriptions/${id}/resume`);
      toast.success(res.message || 'सबस्क्रिप्शन पूर्ववत सुरू केले!');
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message || 'सुरू करता आले नाही');
    }
  };

  const handleRenew = async (id, name) => {
    if (!window.confirm(`${name} चे सबस्क्रिप्शन पुढील महिन्यासाठी नूतनीकरण (Renew) करायचे आहे का?`)) return;
    try {
      const res = await api.post(`/subscriptions/${id}/renew`, { paymentMethod: 'UPI' });
      toast.success(res.message || 'योजना नूतनीकरण केली!');
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message || 'नूतनीकरण अयशस्वी');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            <span>सभासद सबस्क्रिप्शन व्यवस्थापन (Subscriptions)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • सक्रिय सभासदत्व, संपणारे प्लॅन्स, रजा वाढवणे आणि नूतनीकरण
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>ग्राहकाला योजना जोडा</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setExpiringSoon(false); }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">सर्व सबस्क्रिप्शन्स (All)</option>
            <option value="ACTIVE">सक्रिय (Active)</option>
            <option value="EXPIRED">समाप्त झालेले (Expired)</option>
            <option value="PAUSED">स्थगित / रजेवर (Paused)</option>
          </select>
        </div>

        <button
          onClick={() => setExpiringSoon(!expiringSoon)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            expiringSoon
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>≤ ७ दिवसांत संपणारे प्लॅन्स (Alert)</span>
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500 font-medium">सबस्क्रिप्शन लोड होत आहेत...</div>
        ) : subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">ग्राहक कोड</th>
                  <th className="py-3 px-5">सभासदाचे नाव</th>
                  <th className="py-3 px-5">योजनेचे नाव</th>
                  <th className="py-3 px-5">रक्कम</th>
                  <th className="py-3 px-5">सुरुवात तारीख</th>
                  <th className="py-3 px-5">समाप्ती तारीख</th>
                  <th className="py-3 px-5">स्थिती</th>
                  <th className="py-3 px-5 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold font-mono text-blue-700">
                      {s.customer?.customerCode}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {s.customer?.name}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-800">{s.plan?.name}</span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      ₹{Number(s.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(s.startDate).toLocaleDateString('mr-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-900 font-bold">
                      {new Date(s.endDate).toLocaleDateString('mr-IN')}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.status === 'PAUSED'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? 'सक्रिय' : s.status === 'PAUSED' ? 'स्थगित' : 'समाप्त'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'ACTIVE' && (
                          <button
                            onClick={() => handlePause(s.id, s.customer?.name)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="सबस्क्रिप्शन स्थगित करा (गावी गेल्यावर)"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}
                        {s.status === 'PAUSED' && (
                          <button
                            onClick={() => handleResume(s.id, s.customer?.name)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="सबस्क्रिप्शन पूर्ववत सुरू करा"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRenew(s.id, s.customer?.name)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="योजना नूतनीकरण करा"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">कोणतेही सबस्क्रिप्शन आढळले नाही.</p>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">ग्राहकाला नवीन योजना जोडा</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">ग्राहक निवडा *</label>
                <select
                  value={assignForm.customerId}
                  onChange={(e) => setAssignForm({ ...assignForm, customerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode}) — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">मेस योजना निवडा *</label>
                <select
                  value={assignForm.planId}
                  onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{Number(p.price).toFixed(0)} ({p.durationDays} दिवस)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">सुरुवात तारीख</label>
                  <input
                    type="date"
                    value={assignForm.startDate}
                    onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">सूट / डिस्काउंट (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={assignForm.discount}
                    onChange={(e) => setAssignForm({ ...assignForm, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">पेमेंट पद्धत</label>
                <select
                  value={assignForm.initialPaymentMethod}
                  onChange={(e) => setAssignForm({ ...assignForm, initialPaymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="UPI">UPI द्वारे प्राप्त</option>
                  <option value="CASH">रोख रक्कम प्राप्त (Cash)</option>
                  <option value="">पेमेंट बाकी (Pending Invoice)</option>
                </select>
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
                  {submitting ? 'सक्रिय होत आहे...' : 'योजना सक्रिय करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
