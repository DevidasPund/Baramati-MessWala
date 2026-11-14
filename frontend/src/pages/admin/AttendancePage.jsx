import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Calendar,
  Filter,
  Download,
  Plus,
  Trash2,
  Search,
  Scan,
  Coffee,
  Utensils,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);

  // Manual Attendance Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [customersList, setCustomersList] = useState([]);
  const [manualData, setManualData] = useState({
    customerId: '',
    mealType: 'LUNCH',
    date: new Date().toISOString().split('T')[0],
    notes: 'Manually marked by admin',
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', {
        params: {
          date: selectedDate,
          mealType: mealType !== 'ALL' ? mealType : undefined,
          search: search || undefined,
          page,
          limit: 15,
        },
      });
      if (res?.data) {
        setRecords(res.data.records);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, mealType, search, page]);

  // Load customers for manual entry modal
  useEffect(() => {
    if (manualModalOpen && customersList.length === 0) {
      api.get('/customers?limit=100').then((res) => {
        if (res?.data?.customers) {
          setCustomersList(res.data.customers);
          if (res.data.customers.length > 0) {
            setManualData((prev) => ({ ...prev, customerId: res.data.customers[0].id }));
          }
        }
      });
    }
  }, [manualModalOpen]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await api.post('/attendance/manual', manualData);
      toast.success(res.message || 'Attendance marked successfully');
      setManualModalOpen(false);
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Failed to mark attendance');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleDelete = async (id, name, meal) => {
    if (!window.confirm(`Delete attendance record for ${name} (${meal})?`)) return;
    try {
      await api.delete(`/attendance/${id}`);
      toast.success('Attendance record deleted');
      fetchAttendance();
    } catch (err) {
      toast.error('Failed to delete attendance');
    }
  };

  const handleExportExcel = () => {
    const token = localStorage.getItem('messmate_token');
    const url = `/api/attendance/export/excel?date=${selectedDate}${mealType !== 'ALL' ? `&mealType=${mealType}` : ''}${token ? `&token=${token}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Records</h2>
          <p className="text-xs text-slate-500">
            Real-time meal scan logs with duplicate prevention and audit records
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            to="/admin/qr-scanner"
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Launch QR Scanner</span>
          </Link>

          <button
            onClick={() => setManualModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Download Excel Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date & Meal Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setPage(1); }}
            className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Meal Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto justify-center">
          {['ALL', 'BREAKFAST', 'LUNCH', 'DINNER'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setMealType(tab); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mealType === tab
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Meals' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search member name/code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500 font-medium">Loading attendance records...</div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Customer Code</th>
                  <th className="py-3 px-5">Member Name</th>
                  <th className="py-3 px-5">Meal Category</th>
                  <th className="py-3 px-5">Scan Time</th>
                  <th className="py-3 px-5">Scan Method</th>
                  <th className="py-3 px-5">Scanned By</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-emerald-700">
                      <Link to={`/admin/customers/${r.customer?.id}`} className="hover:underline">
                        {r.customer?.customerCode}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {r.customer?.name}
                    </td>
                    <td className="py-3.5 px-5">
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
                    <td className="py-3.5 px-5 text-slate-600">
                      {new Date(r.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                      {r.method === 'CUSTOMER_SCANS_MESS' ? 'Self Mess QR' : r.method === 'STAFF_SCANS_CUSTOMER' ? 'Staff Scanner' : 'Admin Manual'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {r.scannedByStaff ? `${r.scannedByStaff.name}` : 'Self / System'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDelete(r.id, r.customer?.name, r.mealType)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete / Correct record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              No attendance records found for {selectedDate} ({mealType}).
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {pagination.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Attendance Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Manual Attendance Entry</h3>
              <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Select Customer *</label>
                <select
                  value={manualData.customerId}
                  onChange={(e) => setManualData({ ...manualData, customerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode}) — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Meal Type</label>
                  <select
                    value={manualData.mealType}
                    onChange={(e) => setManualData({ ...manualData, mealType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={manualData.date}
                    onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Admin Notes / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Phone battery died, marked manually by manager"
                  value={manualData.notes}
                  onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submittingManual ? 'Saving...' : 'Record Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
