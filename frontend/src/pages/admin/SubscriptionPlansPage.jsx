import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, CheckCircle2, Edit2, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    planType: 'MONTHLY',
    durationDays: 30,
    price: '',
    includedMeals: ['LUNCH', 'DINNER'],
    description: '',
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions/plans');
      if (res?.data?.plans) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      toast.error('मेस योजना लोड करण्यात अडचण आली');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      planType: 'MONTHLY',
      durationDays: 30,
      price: '',
      includedMeals: ['LUNCH', 'DINNER'],
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPlan(p);
    setFormData({
      name: p.name,
      code: p.code,
      planType: p.planType,
      durationDays: p.durationDays,
      price: p.price,
      includedMeals: p.includedMeals,
      description: p.description || '',
    });
    setModalOpen(true);
  };

  const handleToggleMeal = (meal) => {
    setFormData((prev) => {
      const current = prev.includedMeals;
      if (current.includes(meal)) {
        if (current.length === 1) {
          toast.error('किमान एक जेवण निवडणे अनिवार्य आहे');
          return prev;
        }
        return { ...prev, includedMeals: current.filter((m) => m !== meal) };
      } else {
        return { ...prev, includedMeals: [...current, meal] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || (!editingPlan && !formData.code)) {
      toast.error('योजना नाव, कोड आणि दर आवश्यक आहेत');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPlan) {
        await api.put(`/subscriptions/plans/${editingPlan.id}`, formData);
        toast.success('मेस योजना अद्यतनित केली!');
      } else {
        await api.post('/subscriptions/plans', formData);
        toast.success('नवीन मेस योजना तयार केली!');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'कृती अयशस्वी झाली');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" ही योजना हटवायची आहे का? फक्त ० सक्रिय सभासद असलेल्या योजना हटवता येतात.`)) return;
    try {
      await api.delete(`/subscriptions/plans/${id}`);
      toast.success('योजना यशस्वीरित्या हटवली');
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'योजना हटवता आली नाही');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>मेस सबस्क्रिप्शन योजना (Meal Plans)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेस दर, वैधता कालावधी आणि दुपार/रात्रीच्या जेवणाचे नियोजन
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन योजना तयार करा</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500 font-medium">योजना लोड होत आहेत...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    {p.code}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">{p.durationDays} दिवस</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed font-medium">{p.description}</p>

                <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-slate-100">
                  <span className="text-3xl font-black text-slate-900">₹{Number(p.price).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">/ कालावधी</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    समाविष्ट जेवणे:
                  </span>
                  {p.includedMeals.map((meal) => (
                    <div key={meal} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{meal === 'LUNCH' ? 'दुपारचे जेवण' : meal === 'DINNER' ? 'रात्रीचे जेवण' : 'सकाळचा नाश्ता'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(p)}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="योजना संपादित करा"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="योजना हटवा"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPlan ? 'योजना संपादित करा' : 'नवीन सबस्क्रिप्शन योजना'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">योजनेचे नाव *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. मासिक संपूर्ण मेस (दुपार + रात्र)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">योजना कोड *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPlan)}
                    placeholder="उदा. M-BOTH"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">वैधता (दिवस)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">शुल्क दर (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="3000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">प्रकार</label>
                  <select
                    value={formData.planType}
                    onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="MONTHLY">मासिक (Monthly)</option>
                    <option value="WEEKLY">साप्ताहिक (Weekly)</option>
                    <option value="CUSTOM">कस्टम (Custom)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">समाविष्ट जेवणे *</label>
                <div className="flex items-center gap-4 pt-1">
                  {[
                    { id: 'BREAKFAST', label: 'नाश्ता' },
                    { id: 'LUNCH', label: 'दुपार' },
                    { id: 'DINNER', label: 'रात्र' },
                  ].map((m) => (
                    <label key={m.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includedMeals.includes(m.id)}
                        onChange={() => handleToggleMeal(m.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">वर्णन (Description)</label>
                <textarea
                  rows={2}
                  placeholder="उदा. अमर्यादित दुपार व रात्रीचे जेवण, रविवार पुरणपोळी मेजवानीसह"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
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
                  {submitting ? 'जतन होत आहे...' : 'योजना जतन करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
