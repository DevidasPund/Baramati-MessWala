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
    notes: 'प्रशासकाद्वारे मॅन्युअल नोंद',
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
      toast.error('हजेरी नोंदी लोड करण्यात अडचण आली');
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
      toast.error('कृपया ग्राहक निवडा');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await api.post('/attendance/manual', manualData);
      toast.success(res.message || 'हजेरी यशस्वीरित्या नोंदवली गेली!');
      setManualModalOpen(false);
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'हजेरी नोंदवता आली नाही');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleDelete = async (id, name, meal) => {
    if (!window.confirm(`${name} (${meal}) ची हजेरी नोंद हटवायची आहे का?`)) return;
    try {
      await api.delete(`/attendance/${id}`);
      toast.success('हजेरी नोंद हटवण्यात आली');
      fetchAttendance();
    } catch (err) {
      toast.error('हजेरी हटवता आली नाही');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            <span>दैनिक हजेरी व्यवस्थापन (Attendance)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • रियल-टाइम QR स्कॅन व हजेरी नोंदी (डुप्लिकेट स्कॅन प्रतिबंधक)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            to="/admin/qr-scanner"
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>QR स्कॅनर उघडा</span>
          </Link>

          <button
            onClick={() => setManualModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>मॅन्युअल हजेरी</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Excel अहवाल डाउनलोड करा"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Excel निर्यात</span>
          </button>
        </div>
      </div>

      {/* Date & Meal Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setPage(1); }}
            className="px-2.5 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            आज
          </button>
        </div>

        {/* Meal Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto justify-center">
          {[
            { id: 'ALL', label: 'सर्व जेवणे' },
            { id: 'BREAKFAST', label: 'नाश्ता' },
            { id: 'LUNCH', label: 'दुपार' },
            { id: 'DINNER', label: 'रात्र' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setMealType(tab.id); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mealType === tab.id
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="नाव किंवा कोडने शोधा..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500 font-medium">हजेरी नोंदी लोड होत आहेत...</div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">ग्राहक कोड</th>
                  <th className="py-3 px-5">सभासदाचे नाव</th>
                  <th className="py-3 px-5">जेवणाचा प्रकार</th>
                  <th className="py-3 px-5">स्कॅन वेळ</th>
                  <th className="py-3 px-5">पद्धत</th>
                  <th className="py-3 px-5">नोंदणीकर्ता</th>
                  <th className="py-3 px-5 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold font-mono text-blue-700">
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
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {r.mealType === 'BREAKFAST' && <Coffee className="w-3 h-3" />}
                        {r.mealType === 'LUNCH' && <Utensils className="w-3 h-3" />}
                        {r.mealType === 'DINNER' && <Moon className="w-3 h-3" />}
                        {r.mealType === 'BREAKFAST' ? 'नाश्ता' : r.mealType === 'LUNCH' ? 'दुपार' : 'रात्र'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono">
                      {new Date(r.scanTime).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {r.method === 'CUSTOMER_SCANS_MESS' ? 'मेस QR स्कॅन' : r.method === 'STAFF_SCANS_CUSTOMER' ? 'काउंटर स्कॅन' : 'मॅन्युअल नोंद'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {r.scannedByStaff ? `${r.scannedByStaff.name}` : 'स्वयं / सिस्टीम'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDelete(r.id, r.customer?.name, r.mealType)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="हजेरी नोंद हटवा"
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
              {selectedDate} रोजीच्या ({mealType}) हजेरी नोंदी आढळल्या नाहीत.
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>पान {page} / {pagination.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                मागे
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                पुढे
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
              <h3 className="text-base font-bold text-slate-900">मॅन्युअल हजेरी नोंदवा</h3>
              <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">ग्राहक निवडा *</label>
                <select
                  value={manualData.customerId}
                  onChange={(e) => setManualData({ ...manualData, customerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
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
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">जेवणाचा प्रकार</label>
                  <select
                    value={manualData.mealType}
                    onChange={(e) => setManualData({ ...manualData, mealType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="BREAKFAST">सकाळचा नाश्ता</option>
                    <option value="LUNCH">दुपारचे जेवण</option>
                    <option value="DINNER">रात्रीचे जेवण</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">तारीख</label>
                  <input
                    type="date"
                    value={manualData.date}
                    onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">नोंद / कारण</label>
                <input
                  type="text"
                  placeholder="उदा. फोन बंद होता, व्यवस्थापकाने प्रत्यक्ष नोंदवले"
                  value={manualData.notes}
                  onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submittingManual ? 'नोंद होत आहे...' : 'हजेरी जतन करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
