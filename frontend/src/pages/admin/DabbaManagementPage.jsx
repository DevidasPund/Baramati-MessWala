import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  RotateCcw,
  Clock,
  Calendar,
  UtensilsCrossed,
  Search,
  User,
  Phone,
  Edit3,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const DabbaManagementPage = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMeal, setSelectedMeal] = useState('LUNCH'); // BREAKFAST, LUNCH, DINNER
  const [activeTab, setActiveTab] = useState('toBeGiven'); // toBeGiven, given, returned, notReturned
  const [data, setData] = useState({
    summary: {
      totalApprovedCustomers: 0,
      toBeGivenCount: 0,
      givenCount: 0,
      returnedCount: 0,
      notReturnedCount: 0,
    },
    lists: {
      toBeGiven: [],
      given: [],
      returned: [],
      notReturned: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [correctionModal, setCorrectionModal] = useState({
    open: false,
    item: null,
    status: 'GIVEN',
    reason: '',
    removeAttendance: false,
  });

  const fetchDabbaRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dabba/daily?date=${selectedDate}&mealType=${selectedMeal}`);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('डबा माहिती लोड करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDabbaRecords();
  }, [selectedDate, selectedMeal]);

  // Mark Dabba Given -> Automatically triggers attendance creation on backend
  const handleMarkGiven = async (customerId, customerName) => {
    setActionLoading(true);
    try {
      const res = await api.post('/dabba/mark-given', {
        customerId,
        date: selectedDate,
        mealType: selectedMeal,
        remarks: 'डबा स्वीकारला',
      });
      toast.success(`${customerName} यांना डबा दिला व हजेरी नोंदवली गेली!`);
      fetchDabbaRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'डबा नोंदणी अयशस्वी.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Dabba Returned -> Does NOT create another attendance
  const handleMarkReturned = async (customerId, customerName) => {
    setActionLoading(true);
    try {
      await api.post('/dabba/mark-returned', {
        customerId,
        date: selectedDate,
        mealType: selectedMeal,
        remarks: 'डबा परत जमा झाला',
      });
      toast.success(`${customerName} यांचा डबा परत जमा म्हणून नोंदवला!`);
      fetchDabbaRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'डबा परतीची नोंद अयशस्वी.');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch prepare all active dabbas
  const handleBatchPrepare = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/dabba/batch-prepare', {
        date: selectedDate,
        mealType: selectedMeal,
      });
      toast.success(res.message || 'सर्व ग्राहकांसाठी डबा तयार केला.');
      fetchDabbaRecords();
    } catch (err) {
      toast.error('डबा तयार करताना त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  // Correction submit
  const handleCorrectionSubmit = async () => {
    if (!correctionModal.reason.trim()) {
      toast.error('दुरुस्तीचे कारण नमूद करणे अनिवार्य आहे.');
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/dabba/${correctionModal.item.dabba.id}/correction`, {
        status: correctionModal.status,
        reason: correctionModal.reason,
        removeAttendance: correctionModal.removeAttendance,
      });
      toast.success('नोंदीमध्ये सुधारणा करण्यात आली.');
      setCorrectionModal({ open: false, item: null, status: 'GIVEN', reason: '', removeAttendance: false });
      fetchDabbaRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'सुधारणा करताना त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  const currentList = (data.lists[activeTab] || []).filter((item) => {
    const cust = item.customer;
    return (
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm) ||
      (cust.customerCode && cust.customerCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D312E] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#205D48]" />
            <span>दैनिक डबा व हजेरी व्यवस्थापन (Daily Dabba & Attendance)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            डबा दिल्यावरच हजेरी नोंदवली जाते. डबा परत जमा केल्यावर कोणतीही नवीन हजेरी जोडली जात नाही.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchPrepare}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">सर्व डबे तयार करा</span>
            <span className="sm:hidden">तयार करा</span>
          </button>

          <button
            onClick={fetchDabbaRecords}
            className="p-2 bg-[#205D48] text-white rounded-xl hover:bg-[#184837] transition-all shadow-xs"
            title="रिफ्रेश करा"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date & Meal Filter Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EAE3D2] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#205D48]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30"
          />
        </div>

        {/* Meal Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'LUNCH', label: 'दुपारचे जेवण (Lunch)' },
            { id: 'DINNER', label: 'रात्रीचे जेवण (Dinner)' },
            { id: 'BREAKFAST', label: 'नाश्ता (Breakfast)' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMeal(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMeal === m.id
                  ? 'bg-white text-[#205D48] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Cards (Tab Selectors) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveTab('toBeGiven')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'toBeGiven'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>द्यायचे डबे (To Give)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
            {data.summary.toBeGivenCount}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('given')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'given'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-white border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>दिलेले डबे (Given / हजेरी)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
            {data.summary.givenCount}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('returned')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'returned'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
              : 'bg-white border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>जमा झालेले डबे (Returned)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 mt-1">
            {data.summary.returnedCount}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('notReturned')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'notReturned'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
              : 'bg-white border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>परत न आलेले (Pending Return)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1">
            {data.summary.notReturnedCount}
          </div>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ग्राहकाचे नाव किंवा मोबाइल नंबरने शोधा..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE3D2] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 shadow-xs"
        />
      </div>

      {/* Customer List (Mobile-Optimized Cards) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse h-24" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="font-bold text-slate-700 text-sm">या यादीत कोणतेही रेकॉर्ड आढळले नाहीत.</div>
          <p className="text-xs text-slate-400">निवडलेल्या तारीख आणि वेळेनुसार ग्राहक माहिती उपलब्ध नाही.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentList.map(({ customer, dabba }) => {
            const isGiven = dabba?.status === 'GIVEN';
            const isReturned = dabba?.status === 'RETURNED';

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 border border-[#EAE3D2] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#205D48]/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{customer.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                        {customer.customerCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{customer.phone}</span>
                      {customer.subscriptions?.[0]?.plan && (
                        <span className="text-[11px] text-[#205D48] font-bold">
                          • {customer.subscriptions[0].plan.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                      isReturned
                        ? 'bg-blue-100 text-blue-800'
                        : isGiven
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isReturned ? 'डबा जमा' : isGiven ? 'डबा दिला (हजेरी ✅)' : 'द्यायचा आहे'}
                  </span>
                </div>

                {/* Timestamps if recorded */}
                {(dabba?.givenAt || dabba?.returnedAt) && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl flex items-center justify-between border border-slate-100">
                    {dabba?.givenAt && (
                      <span>दिला: {new Date(dabba.givenAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {dabba?.returnedAt && (
                      <span>जमा: {new Date(dabba.returnedAt).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                )}

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {!isGiven && !isReturned && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleMarkGiven(customer.id, customer.name)}
                      className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 bg-[#205D48] hover:bg-[#184837] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>डबा दिला (हजेरी नोंदवा)</span>
                    </button>
                  )}

                  {isGiven && !isReturned && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleMarkReturned(customer.id, customer.name)}
                      className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>डबा परत जमा करा (Returned)</span>
                    </button>
                  )}

                  {isReturned && (
                    <div className="flex-1 min-h-[38px] flex items-center justify-center gap-1 text-xs text-blue-700 font-bold bg-blue-50 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>डबा यशस्वीरीत्या जमा झाला</span>
                    </div>
                  )}

                  {/* Correction Button if recorded */}
                  {dabba?.id && (
                    <button
                      onClick={() =>
                        setCorrectionModal({
                          open: true,
                          item: { customer, dabba },
                          status: dabba.status,
                          reason: '',
                          removeAttendance: false,
                        })
                      }
                      title="दुरुस्ती करा"
                      className="min-h-[42px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Authorized Correction Modal */}
      {correctionModal.open && correctionModal.item && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#205D48]" />
              <span>डबा नोंदीमध्ये दुरुस्ती (Correction)</span>
            </h3>

            <p className="text-xs text-slate-600">
              ग्राहक <span className="font-bold text-slate-900">{correctionModal.item.customer.name}</span> साठी
              स्थिती बदला:
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">नवीन स्थिती</label>
              <select
                value={correctionModal.status}
                onChange={(e) => setCorrectionModal({ ...correctionModal, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-slate-50 focus:bg-white"
              >
                <option value="PREPARED">तयार आहे (PREPARED)</option>
                <option value="GIVEN">डबा दिला (GIVEN)</option>
                <option value="RETURNED">डबा परत जमा (RETURNED)</option>
              </select>
            </div>

            {correctionModal.status !== 'GIVEN' && (
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={correctionModal.removeAttendance}
                  onChange={(e) =>
                    setCorrectionModal({ ...correctionModal, removeAttendance: e.target.checked })
                  }
                  className="rounded text-[#205D48] focus:ring-[#205D48]"
                />
                <span>हजेरी नोंदणी सुद्धा काढून टाका</span>
              </label>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">दुरुस्तीचे कारण (अनिवार्य)</label>
              <input
                type="text"
                value={correctionModal.reason}
                onChange={(e) => setCorrectionModal({ ...correctionModal, reason: e.target.value })}
                placeholder="उदा. चुकीने क्लिक झाले, ग्राहक अनुपस्थित होता..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#205D48]/30"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCorrectionModal({ open: false, item: null, status: 'GIVEN', reason: '', removeAttendance: false })}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                रद्द करा
              </button>
              <button
                disabled={actionLoading}
                onClick={handleCorrectionSubmit}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#205D48] hover:bg-[#184837] rounded-xl"
              >
                {actionLoading ? 'जतन होत आहे...' : 'दुरुस्ती जतन करा'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
