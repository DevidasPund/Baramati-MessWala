import React, { useState, useEffect } from 'react';
import { CalendarCheck, Coffee, Utensils, Moon, CheckCircle2, Clock, Filter, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerAttendancePage = () => {
  const { user } = useAuth();
  const customer = user?.customer;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMealType, setSelectedMealType] = useState('ALL');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance?limit=100`);
        if (res?.data?.records) {
          setRecords(res.data.records);
        } else if (res?.data?.attendance) {
          setRecords(res.data.attendance);
        }
      } catch (err) {
        toast.error('हजेरी इतिहास लोड करण्यात अडचण आली');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [customer?.id]);

  const filteredRecords = selectedMealType === 'ALL'
    ? records
    : records.filter((r) => r.mealType === selectedMealType);

  const breakfastCount = records.filter((r) => r.mealType === 'BREAKFAST').length;
  const lunchCount = records.filter((r) => r.mealType === 'LUNCH').length;
  const dinnerCount = records.filter((r) => r.mealType === 'DINNER').length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            दैनिक हजेरी इतिहास
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला येथे घेतलेल्या जेवणाची संपूर्ण नोंद
          </p>
        </div>

        {/* Meal Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          {[
            { id: 'ALL', name: 'सर्व' },
            { id: 'BREAKFAST', name: 'नाश्ता' },
            { id: 'LUNCH', name: 'दुपारचे' },
            { id: 'DINNER', name: 'रात्रीचे' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMealType(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedMealType === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">एकूण हजेरी</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{records.length}</div>
          <div className="text-[10px] text-slate-400">एकूण जेवणे</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">सकाळचा नाश्ता</span>
          <div className="text-2xl font-extrabold text-orange-600 mt-1">{breakfastCount}</div>
          <div className="text-[10px] text-slate-400">वेळा नाश्ता</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">दुपारचे जेवण</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{lunchCount}</div>
          <div className="text-[10px] text-slate-400">वेळा दुपारचे</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">रात्रीचे जेवण</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{dinnerCount}</div>
          <div className="text-[10px] text-slate-400">वेळा रात्रीचे</div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs font-bold text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>हजेरी नोंद लोड होत आहे...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">तारीख</th>
                  <th className="py-3.5 px-5">जेवणाचा प्रकार</th>
                  <th className="py-3.5 px-5">नोंदणी वेळ</th>
                  <th className="py-3.5 px-5">नोंदणी पद्धत</th>
                  <th className="py-3.5 px-5 text-right">स्थिती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {new Date(r.date).toLocaleDateString('mr-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        r.mealType === 'BREAKFAST'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : r.mealType === 'LUNCH'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {r.mealType === 'BREAKFAST' && <Coffee className="w-3.5 h-3.5" />}
                        {r.mealType === 'LUNCH' && <Utensils className="w-3.5 h-3.5" />}
                        {r.mealType === 'DINNER' && <Moon className="w-3.5 h-3.5" />}
                        <span>
                          {r.mealType === 'BREAKFAST'
                            ? 'सकाळचा नाश्ता'
                            : r.mealType === 'LUNCH'
                            ? 'दुपारचे जेवण'
                            : 'रात्रीचे जेवण'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                      {new Date(r.scanTime).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {r.method === 'CUSTOMER_SCANS_MESS'
                        ? '📱 काउंटर QR स्कॅन'
                        : r.method === 'STAFF_SCANS_CUSTOMER'
                        ? '🧑‍🍳 स्टाफ स्कॅन'
                        : '✍️ मॅन्युअल नोंद'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>हजेरी नोंदवली</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p>कोणतीही हजेरी नोंद आढळली नाही.</p>
          </div>
        )}
      </div>
    </div>
  );
};
