import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, Send, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CustomerExtraMealsPage = () => {
  const [activeTab, setActiveTab] = useState('book'); // 'book', 'skip', 'history'
  const [extraMeals, setExtraMeals] = useState([]);
  const [mealRequests, setMealRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extra meal form
  const [extraForm, setExtraForm] = useState({
    mealType: 'LUNCH',
    date: new Date().toISOString().split('T')[0],
    count: 1,
    mealCategory: 'EXTRA_MEAL',
    requestReason: '',
  });

  // Skip meal form
  const [skipForm, setSkipForm] = useState({
    requestType: 'MEAL_SKIP',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    reason: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [emRes, reqRes] = await Promise.all([
        api.get('/extra-meals'),
        api.get('/extra-meals/requests'),
      ]);
      if (emRes?.data?.extraMeals) setExtraMeals(emRes.data.extraMeals);
      if (reqRes?.data?.requests) setMealRequests(reqRes.data.requests);
    } catch (err) {
      toast.error('माहिती लोड करण्यात अडचण आली');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleBookExtraMeal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/extra-meals/book', extraForm);
      toast.success(res.message || 'अतिरिक्त जेवण यशस्वीरित्या नोंदवले गेले!');
      fetchHistory();
      setActiveTab('history');
    } catch (err) {
      toast.error(err.message || 'नोंदणी अयशस्वी झाली');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/extra-meals/requests', skipForm);
      toast.success(res.message || 'जेवण बंद करण्याची विनंती यशस्वीरित्या पाठवली!');
      fetchHistory();
      setActiveTab('history');
    } catch (err) {
      toast.error(err.message || 'विनंती पाठवण्यात त्रुटी आली');
    } finally {
      setSubmitting(false);
    }
  };

  // Pricing calculation
  const getRate = (category, type) => {
    if (category === 'GUEST_MEAL') return 110;
    if (type === 'BREAKFAST') return 40;
    return 90;
  };

  const currentRate = getRate(extraForm.mealCategory, extraForm.mealType);
  const totalAmount = currentRate * (Number(extraForm.count) || 1);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            अतिरिक्त जेवण व जेवण बंद विनंती
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            मित्र किंवा पाहुण्यांसाठी जास्तीचे जेवण नोंदवा किंवा गैरहजेरीच्या दिवशी जेवण बंद करा
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'book'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            अतिरिक्त जेवण
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skip')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'skip'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            जेवण बंद विनंती
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            विनंती इतिहास
          </button>
        </div>
      </div>

      {/* Tab 1: Book Extra Meal Form */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-extrabold text-slate-900">अतिरिक्त जेवण किंवा पाहुण्यांचे जेवण नोंदवा</h3>
          </div>

          <form onSubmit={handleBookExtraMeal} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  जेवणाची श्रेणी *
                </label>
                <select
                  value={extraForm.mealCategory}
                  onChange={(e) => setExtraForm({ ...extraForm, mealCategory: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="EXTRA_MEAL">स्वतःसाठी अतिरिक्त डिश (Extra Meal)</option>
                  <option value="GUEST_MEAL">पाहुण्यांचे जेवण (Guest Special Thali)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  जेवणाचा प्रकार *
                </label>
                <select
                  value={extraForm.mealType}
                  onChange={(e) => setExtraForm({ ...extraForm, mealType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="BREAKFAST">सकाळचा नाश्ता (₹४०)</option>
                  <option value="LUNCH">दुपारचे जेवण (₹९०)</option>
                  <option value="DINNER">रात्रीचे जेवण (₹९०)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  तारीख *
                </label>
                <input
                  type="date"
                  required
                  value={extraForm.date}
                  onChange={(e) => setExtraForm({ ...extraForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ताटांची संख्या (Quantity) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={extraForm.count}
                  onChange={(e) => setExtraForm({ ...extraForm, count: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                विशेष टिप्पणी / पाहुण्याचे नाव (पर्यायी)
              </label>
              <input
                type="text"
                placeholder="उदा. कॉलेजचा मित्र येत आहे, १ अतिरिक्त ताट"
                value={extraForm.requestReason}
                onChange={(e) => setExtraForm({ ...extraForm, requestReason: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Total calculation preview card */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                  दर: ₹{currentRate} / ताट
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  {extraForm.count} ताट x ₹{currentRate}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">एकूण आकारणी</span>
                <span className="text-xl font-black text-blue-700 font-mono">₹{totalAmount}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>अतिरिक्त जेवण बुक करा (Book Extra Meal)</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Request Meal Skip Form */}
      {activeTab === 'skip' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Ban className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-extrabold text-slate-900">जेवण बंद करण्याची विनंती (Meal Skip)</h3>
          </div>

          <form onSubmit={handleSkipRequest} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  सुरुवात तारीख *
                </label>
                <input
                  type="date"
                  required
                  value={skipForm.startDate}
                  onChange={(e) => setSkipForm({ ...skipForm, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  शेवटची तारीख *
                </label>
                <input
                  type="date"
                  required
                  value={skipForm.endDate}
                  onChange={(e) => setSkipForm({ ...skipForm, endDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                जेवणाचा प्रकार *
              </label>
              <select
                value={skipForm.mealType}
                onChange={(e) => setSkipForm({ ...skipForm, mealType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">सर्व वेळचे जेवण (संपूर्ण दिवस)</option>
                <option value="BREAKFAST">फक्त सकाळचा नाश्ता</option>
                <option value="LUNCH">फक्त दुपारचे जेवण</option>
                <option value="DINNER">फक्त रात्रीचे जेवण</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                जेवण बंद करण्याचे कारण *
              </label>
              <textarea
                required
                rows={3}
                placeholder="उदा. गावी जात आहे, कॉलेजची परीक्षा आहे, इत्यादी."
                value={skipForm.reason}
                onChange={(e) => setSkipForm({ ...skipForm, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              ⚠️ <strong>सूचना:</strong> जेवण तयार होण्यापूर्वी किमान २ तास आधी विनंती पाठवणे आवश्यक आहे जेणेकरून अन्न वाया जाणार नाही.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Send className="w-4 h-4" />
              <span>विनंती पाठवा (Send Skip Request)</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: History & Status */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Extra meals table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">अतिरिक्त जेवण नोंदी (Extra Meals)</h3>
              <span className="text-xs text-slate-400 font-medium">{extraMeals.length} नोंदी</span>
            </div>

            {extraMeals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">तारीख</th>
                      <th className="py-3 px-5">जेवणाचा प्रकार</th>
                      <th className="py-3 px-5 text-center">संख्या</th>
                      <th className="py-3 px-5 text-right">रक्कम</th>
                      <th className="py-3 px-5 text-right">स्थिती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {extraMeals.map((em) => (
                      <tr key={em.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-5 font-bold text-slate-900">{em.date}</td>
                        <td className="py-3 px-5 font-semibold text-slate-800">{em.mealType}</td>
                        <td className="py-3 px-5 text-center font-bold">{em.count || 1}</td>
                        <td className="py-3 px-5 text-right font-mono font-bold text-slate-900">₹{em.totalAmount}</td>
                        <td className="py-3 px-5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            em.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {em.status === 'APPROVED' ? 'मंजूर' : 'प्रलंबित'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">कोणतीही अतिरिक्त जेवण नोंद नाही.</div>
            )}
          </div>

          {/* Skip requests table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">जेवण बंद विनंत्या (Meal Skip Requests)</h3>
              <span className="text-xs text-slate-400 font-medium">{mealRequests.length} विनंत्या</span>
            </div>

            {mealRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">कालावधी</th>
                      <th className="py-3 px-5">प्रकार</th>
                      <th className="py-3 px-5">कारण</th>
                      <th className="py-3 px-5 text-right">स्थिती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {mealRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-5 font-bold text-slate-900">
                          {req.startDate} {req.endDate && req.endDate !== req.startDate ? `ते ${req.endDate}` : ''}
                        </td>
                        <td className="py-3 px-5 font-semibold text-slate-800">{req.mealType}</td>
                        <td className="py-3 px-5 text-slate-600">{req.reason || '-'}</td>
                        <td className="py-3 px-5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : req.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {req.status === 'APPROVED' ? '✓ मंजूर' : req.status === 'PENDING' ? '⏳ प्रलंबित' : 'नाकारले'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">कोणतीही जेवण बंद विनंती नाही.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
