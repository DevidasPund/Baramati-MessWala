import React, { useState, useEffect } from 'react';
import { CalendarCheck, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const StaffAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mealType, setMealType] = useState('ALL');
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', {
        params: {
          date: todayStr,
          mealType: mealType !== 'ALL' ? mealType : undefined,
          search: search || undefined,
          limit: 50,
        },
      });
      if (res?.data?.records) {
        setRecords(res.data.records);
      }
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [mealType, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Today's Meal Attendance</h2>
          <p className="text-xs text-slate-500">Real-time scan logs for {new Date().toLocaleDateString()}</p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'BREAKFAST', 'LUNCH', 'DINNER'].map((tab) => (
            <button
              key={tab}
              onClick={() => setMealType(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mealType === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">Loading today's scans...</div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-5">Member Name</th>
                  <th className="py-3 px-5">Meal</th>
                  <th className="py-3 px-5">Time</th>
                  <th className="py-3 px-5">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-5 font-bold text-blue-600">{r.customer?.customerCode}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{r.customer?.name}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-emerald-700">{r.mealType}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {new Date(r.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">{r.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-16 text-xs text-slate-400">No attendance marked yet today.</p>
        )}
      </div>
    </div>
  );
};
