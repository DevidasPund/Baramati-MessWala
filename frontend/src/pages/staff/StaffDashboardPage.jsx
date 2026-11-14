import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scan, CalendarCheck, Search, Users, Coffee, Utensils, Moon, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const StaffDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/staff/dashboard');
        if (res?.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Staff dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick Launch Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 bg-blue-600/40 px-2.5 py-0.5 rounded-full">
            Staff Counter Mode
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2">Counter Attendance Terminal</h1>
          <p className="text-xs text-blue-100 max-w-lg mt-1">
            Scan arriving member passes or search customers to verify valid meal plans in real time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/staff/qr-scanner"
            className="px-6 py-3 bg-white text-blue-900 font-bold rounded-xl text-xs shadow hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Scan className="w-4 h-4 text-blue-600" />
            <span>Open High-Speed Camera Scanner</span>
          </Link>
          <Link
            to="/staff/search"
            className="px-5 py-3 bg-blue-900/60 hover:bg-blue-900 text-white font-bold rounded-xl text-xs border border-blue-400/30 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Member Code / Phone</span>
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Scans</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.todayAttendance?.total || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Breakfast</span>
            <div className="text-2xl font-black text-orange-600 mt-1">{stats.todayAttendance?.breakfast || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Lunch</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.todayAttendance?.lunch || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Dinner</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{stats.todayAttendance?.dinner || 0}</div>
          </div>
        </div>
      )}

      {/* Recent Scans Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900">Recent Scans Today</h3>
          <Link to="/staff/attendance" className="text-xs text-blue-600 font-bold hover:underline">
            View All Scans →
          </Link>
        </div>

        {stats?.recentScans?.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {stats.recentScans.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{s.customer?.name}</div>
                  <div className="text-[10px] text-slate-400">{s.customer?.customerCode} • {s.mealType}</div>
                </div>
                <span className="text-slate-500 font-medium">
                  {new Date(s.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-xs text-slate-400">No scans recorded yet today.</p>
        )}
      </div>
    </div>
  );
};
