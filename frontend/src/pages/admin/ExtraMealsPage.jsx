import React, { useState, useEffect } from 'react';
import { Utensils, CheckCircle2, XCircle, Clock, Filter, AlertCircle, UtensilsCrossed } from 'lucide-react';
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
      toast.error('अतिरिक्त जेवण नोंदी लोड करता आल्या नाहीत');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtraMeals();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    const statusLabel = status === 'APPROVED' ? 'मंजूर' : 'नाकारणे';
    const adminNotes = prompt(`या विनंतीसाठी काही शेरा लिहायचा आहे का? (${statusLabel}):`);
    if (adminNotes === null) return;

    try {
      const res = await api.put(`/extra-meals/${id}/status`, { status, adminNotes });
      toast.success(res.message || `विनंती यशस्वीरित्या ${statusLabel} केली!`);
      fetchExtraMeals();
    } catch (err) {
      toast.error(err.message || 'कृती अयशस्वी झाली');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-blue-600" />
            <span>अतिरिक्त व पाहुणे जेवण विनंत्या (Extra Meals)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • ग्राहकांच्या अतिरिक्त जेवण व पाहुण्यांच्या थाळी विनंत्यांची मंजुरी
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="ALL">सर्व विनंत्या (All)</option>
            <option value="PENDING">प्रलंबित विनंत्या (Pending)</option>
            <option value="APPROVED">मंजूर व बिलिंगमध्ये जोडलेले (Approved)</option>
            <option value="REJECTED">नाकारलेले (Rejected)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500 font-medium">विनंत्या लोड होत आहेत...</div>
        ) : extraMeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">सभासदाचे नाव</th>
                  <th className="py-3 px-5">तारीख व वेळ</th>
                  <th className="py-3 px-5">प्रकार</th>
                  <th className="py-3 px-5">संख्या</th>
                  <th className="py-3 px-5">एकूण शुल्क</th>
                  <th className="py-3 px-5">स्थिती</th>
                  <th className="py-3 px-5 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {extraMeals.map((em) => (
                  <tr key={em.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{em.customer?.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{em.customer?.customerCode}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900 font-mono">{em.date}</span>
                      <div className="text-[11px] font-semibold text-blue-700">
                        {em.mealType === 'LUNCH' ? 'दुपारचे जेवण' : em.mealType === 'DINNER' ? 'रात्रीचे जेवण' : 'नाश्ता'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {em.mealCategory === 'GUEST_MEAL' ? 'पाहुणे जेवण (Guest)' : 'अतिरिक्त जेवण (Extra)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900">{em.count} थाळी</td>
                    <td className="py-3.5 px-5 font-bold text-emerald-600">
                      ₹{Number(em.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        em.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : em.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {em.status === 'APPROVED' ? 'मंजूर' : em.status === 'PENDING' ? 'प्रलंबित' : 'नाकारले'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {em.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(em.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            मंजूर करा
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(em.id, 'REJECTED')}
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
            <Utensils className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">कोणतीही अतिरिक्त जेवण नोंद आढळली नाही.</p>
          </div>
        )}
      </div>
    </div>
  );
};
