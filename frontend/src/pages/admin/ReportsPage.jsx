import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  IndianRupee,
  Users,
  CalendarCheck,
  Utensils,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const ReportsPage = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/analytics', {
        params: { startDate, endDate },
      });
      if (res?.data) {
        setReport(res.data);
      }
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleExport = (type) => {
    const token = localStorage.getItem('messmate_token');
    const url = `/api/reports/export/excel?type=${type}&startDate=${startDate}&endDate=${endDate}${token ? `&token=${token}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports & Analytics Engine</h2>
          <p className="text-xs text-slate-500">
            Generate operational and financial summaries with one-click Excel exports
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
          />
        </div>
      </div>

      {/* Analytics KPI Summary Cards */}
      {loading || !report ? (
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Revenue Collected</span>
            <div className="text-2xl font-black text-emerald-600">
              ₹{Number(report.summary.totalRevenue).toFixed(0)}
            </div>
            <p className="text-[10px] text-slate-400">Verified cash + UPI in selected period</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Attendance Scans</span>
            <div className="text-2xl font-black text-slate-900">
              {report.summary.totalAttendance}
            </div>
            <p className="text-[10px] text-slate-400">
              B: {report.summary.breakfastCount} | L: {report.summary.lunchCount} | D: {report.summary.dinnerCount}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Extra Meals</span>
            <div className="text-2xl font-black text-teal-700">
              {report.summary.totalExtraMeals}
            </div>
            <p className="text-[10px] text-slate-400">Billed to customers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">New Registrations</span>
            <div className="text-2xl font-black text-blue-600">
              {report.summary.newCustomers}
            </div>
            <p className="text-[10px] text-slate-400">Joined in this period</p>
          </div>
        </div>
      )}

      {/* Export Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Download Excel (.xlsx) Reports</h3>
          <p className="text-xs text-slate-500">Filtered precisely according to the selected date range</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">Attendance Report</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Detailed customer scans, meal categories, timestamps, and scanning staff.
              </p>
            </div>
            <button
              onClick={() => handleExport('attendance')}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">Revenue & Collections</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                All payment transactions, UPI UTR numbers, cash entries, and invoices.
              </p>
            </div>
            <button
              onClick={() => handleExport('revenue')}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Revenue</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">Customer Master List</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Complete member directory, active plans, expiry dates, and contact phones.
              </p>
            </div>
            <button
              onClick={() => handleExport('customers')}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Customers</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-orange-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">Extra Meals Report</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Extra breakfast, lunch, and dinner bookings with billing status and charges.
              </p>
            </div>
            <button
              onClick={() => handleExport('extra-meals')}
              className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Extra Meals</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
