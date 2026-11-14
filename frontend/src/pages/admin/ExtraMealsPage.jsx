import React, { useState, useEffect } from 'react';
import { Utensils, CheckCircle2, XCircle, Clock, Filter, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const ExtraMealsPage = () => {
  const [extraMeals, setExtraMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchExtraMeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/extra-meals', {
        params: { status: statusFilter !== 'ALL' ? statusFilter : undefined },
      });
      if (res?.data?.extraMeals) {
        setExtraMeals(res.data.extraMeals);
      }
    } catch (err) {
      toast.error('Failed to load extra meals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtraMeals();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    const adminNotes = prompt(`Enter optional note for ${status}:`);
    if (adminNotes === null) return;

    try {
      const res = await api.put(`/extra-meals/${id}/status`, { status, adminNotes });
      toast.success(res.message || `Request marked as ${status}`);
      fetchExtraMeals();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Extra & Guest Meal Bookings</h2>
          <p className="text-xs text-slate-500">
            Review customer requests for additional meals; approved meals are billed automatically
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved & Billed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500">Loading requests...</div>
        ) : extraMeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-5">Date & Meal</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Count</th>
                  <th className="py-3 px-5">Total Charge</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {extraMeals.map((em) => (
                  <tr key={em.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{em.customer?.name}</div>
                      <div className="text-[10px] text-slate-400">{em.customer?.customerCode}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900">{em.date}</span>
                      <div className="text-[11px] font-semibold text-emerald-700">{em.mealType}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {em.mealCategory === 'GUEST_MEAL' ? 'Guest Meal' : 'Extra Meal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{em.count}</td>
                    <td className="py-3.5 px-5 font-bold text-emerald-600">
                      ₹{Number(em.totalAmount).toFixed(0)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        em.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : em.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {em.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {em.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(em.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(em.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <Utensils className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">No extra meal records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
