import React, { useState, useEffect } from 'react';
import { CalendarCheck, Coffee, Utensils, Moon, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerAttendancePage = () => {
  const { user } = useAuth();
  const customer = user?.customer;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get(`/customers/${customer?.id}`);
        if (res?.data?.customer?.attendance) {
          setRecords(res.data.customer.attendance);
        }
      } catch (err) {
        toast.error('Failed to load attendance history');
      } finally {
        setLoading(false);
      }
    };
    if (customer?.id) fetchAttendance();
  }, [customer?.id]);

  const breakfastCount = records.filter((r) => r.mealType === 'BREAKFAST').length;
  const lunchCount = records.filter((r) => r.mealType === 'LUNCH').length;
  const dinnerCount = records.filter((r) => r.mealType === 'DINNER').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Attendance History</h2>
        <p className="text-xs text-slate-500">Record of your meals enjoyed at Baramati Messwala</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Meals</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{records.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Breakfast</span>
          <div className="text-2xl font-black text-orange-600 mt-1">{breakfastCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Lunch</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{lunchCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Dinner</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{dinnerCount}</div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">Loading your history...</div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Meal Category</th>
                  <th className="py-3 px-5">Scan Time</th>
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-bold text-slate-900">{r.date}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        r.mealType === 'BREAKFAST'
                          ? 'bg-orange-50 text-orange-700'
                          : r.mealType === 'LUNCH'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {r.mealType === 'BREAKFAST' && <Coffee className="w-3 h-3" />}
                        {r.mealType === 'LUNCH' && <Utensils className="w-3 h-3" />}
                        {r.mealType === 'DINNER' && <Moon className="w-3 h-3" />}
                        {r.mealType}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {new Date(r.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                      {r.method === 'CUSTOMER_SCANS_MESS' ? 'Self Mess QR' : 'Counter Scanner'}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No meals marked yet. Start scanning your QR at the mess counter!</p>
          </div>
        )}
      </div>
    </div>
  );
};
