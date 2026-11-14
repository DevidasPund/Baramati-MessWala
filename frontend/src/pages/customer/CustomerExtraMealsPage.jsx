import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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
      toast.error('Failed to load records');
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
      toast.success(res.message || 'Extra meal booked successfully!');
      fetchHistory();
      setActiveTab('history');
    } catch (err) {
      toast.error(err.message || 'Failed to book extra meal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/extra-meals/requests', skipForm);
      toast.success(res.message || 'Meal skip request submitted!');
      fetchHistory();
      setActiveTab('history');
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Extra Meals & Meal Skips</h2>
        <p className="text-xs text-slate-500">Book add-on meals for yourself or guests, or request meal skips</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('book')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'book' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
          }`}
        >
          Book Extra / Guest Meal
        </button>
        <button
          onClick={() => setActiveTab('skip')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'skip' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
          }`}
        >
          Request Meal Skip
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'history' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
          }`}
        >
          My Request History
        </button>
      </div>

      {/* Tab 1: Book Extra Meal */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900">Book Extra or Guest Meals</h3>
          <p className="text-xs text-slate-500">Extra meals are billed at fixed rates (Breakfast ₹40, Lunch/Dinner ₹90, Guest ₹110)</p>

          <form onSubmit={handleBookExtraMeal} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Meal Category</label>
                <select
                  value={extraForm.mealCategory}
                  onChange={(e) => setExtraForm({ ...extraForm, mealCategory: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="EXTRA_MEAL">Extra Meal for Self</option>
                  <option value="GUEST_MEAL">Guest Meal for Friend/Visitor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Meal Timing</label>
                <select
                  value={extraForm.mealType}
                  onChange={(e) => setExtraForm({ ...extraForm, mealType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={extraForm.date}
                  onChange={(e) => setExtraForm({ ...extraForm, date: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Quantity / Count</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={extraForm.count}
                  onChange={(e) => setExtraForm({ ...extraForm, count: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. My classmate visiting from Pune"
                value={extraForm.requestReason}
                onChange={(e) => setExtraForm({ ...extraForm, requestReason: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Confirm Meal Booking'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Skip Meal */}
      {activeTab === 'skip' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900">Request Meal Skip (Save Credit)</h3>
          <p className="text-xs text-slate-500">Informing the kitchen in advance helps avoid food wastage and saves your meal quota.</p>

          <form onSubmit={handleSkipRequest} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Skip Date</label>
                <input
                  type="date"
                  required
                  value={skipForm.startDate}
                  onChange={(e) => setSkipForm({ ...skipForm, startDate: e.target.value, endDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Meal to Skip</label>
                <select
                  value={skipForm.mealType}
                  onChange={(e) => setSkipForm({ ...skipForm, mealType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                  <option value="BREAKFAST">Breakfast</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Reason for Skip</label>
              <input
                type="text"
                required
                placeholder="e.g. Traveling to hometown / college practicals"
                value={skipForm.reason}
                onChange={(e) => setSkipForm({ ...skipForm, reason: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Meal Skip Notice'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
              Extra Meal Bookings ({extraMeals.length})
            </div>
            {extraMeals.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {extraMeals.map((em) => (
                  <div key={em.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{em.count}x {em.mealType} ({em.mealCategory})</div>
                      <div className="text-[10px] text-slate-400">Date: {em.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">₹{Number(em.totalAmount).toFixed(0)}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        em.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {em.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No extra meal bookings.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
