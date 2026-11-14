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
      toast.error('अहवाल माहिती लोड करता आली नाही');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>मेस व्यवसाय अहवाल व ॲनालिटिक्स (Reports)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • उत्पन्न, दैनिक हजेरी, अतिरिक्त जेवण आणि एक्सेल (.xlsx) निर्यात
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <Calendar className="w-4 h-4 text-blue-600" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
          />
          <span className="text-xs text-slate-400 font-semibold">ते</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
          />
        </div>
      </div>

      {/* Analytics KPI Summary Cards */}
      {loading || !report ? (
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">एकूण जमा महसूल</span>
            <div className="text-2xl font-black text-emerald-600">
              ₹{Number(report.summary.totalRevenue).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">निवडलेल्या कालावधीतील रोख + UPI</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">एकूण हजेरी नोंदी</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {report.summary.totalAttendance}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              नाश्ता: {report.summary.breakfastCount} | दुपार: {report.summary.lunchCount} | रात्र: {report.summary.dinnerCount}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">मंजूर अतिरिक्त जेवणे</span>
            <div className="text-2xl font-black text-blue-700 font-mono">
              {report.summary.totalExtraMeals}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">बिलिंगमध्ये समाविष्ट केलेले</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">नवीन ग्राहक नोंदणी</span>
            <div className="text-2xl font-black text-indigo-600 font-mono">
              {report.summary.newCustomers}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">या कालावधीत जोडलेले सभासद</p>
          </div>
        </div>
      )}

      {/* Export Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">एक्सेल (.xlsx) अहवाल डाउनलोड करा</h3>
          <p className="text-xs text-slate-500 font-medium">निवडलेल्या कालावधीनुसार अचूक डेटा एका क्लिकवर निर्यात करा</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">हजेरी अहवाल</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                तारीखनिहाय जेवण स्कॅन, दुपार/रात्र नोंदी आणि स्कॅन वेळ.
              </p>
            </div>
            <button
              onClick={() => handleExport('attendance')}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>हजेरी Excel डाउनलोड</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">उत्पन्न व वसुली अहवाल</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                सर्व पेमेंट व्यवहार, UPI UTR क्रमांक, रोख नोंदी आणि इनव्हॉइस.
              </p>
            </div>
            <button
              onClick={() => handleExport('revenue')}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>उत्पन्न Excel डाउनलोड</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-purple-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">ग्राहक मास्टर यादी</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                सर्व सभासद, चालू योजना, वैधता समाप्ती आणि संपर्क फोन.
              </p>
            </div>
            <button
              onClick={() => handleExport('customers')}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ग्राहक Excel डाउनलोड</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
            <div>
              <FileSpreadsheet className="w-8 h-8 text-orange-600 mb-2" />
              <h4 className="font-bold text-slate-900 text-sm">अतिरिक्त जेवण अहवाल</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                पाहुणे व अतिरिक्त जेवण नोंदी, बिलिंग स्थिती आणि आकारलेले शुल्क.
              </p>
            </div>
            <button
              onClick={() => handleExport('extra-meals')}
              className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>अतिरिक्त जेवण Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
