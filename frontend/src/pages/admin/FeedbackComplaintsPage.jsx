import React, { useState, useEffect } from 'react';
import { Star, MessageSquareWarning, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const FeedbackComplaintsPage = () => {
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(5.0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, feedRes] = await Promise.all([
        api.get('/feedback/complaints'),
        api.get('/feedback/feedback'),
      ]);
      if (compRes?.data?.complaints) setComplaints(compRes.data.complaints);
      if (feedRes?.data?.feedbacks) setFeedbacks(feedRes.data.feedbacks);
      if (feedRes?.data?.avgRating) setAvgRating(feedRes.data.avgRating);
    } catch (err) {
      toast.error('अभिप्राय लोड करता आला नाही');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveComplaint = async (id) => {
    const adminResponse = prompt('ग्राहकासाठी निवारण संदेश / उत्तर लिहा:');
    if (adminResponse === null) return;

    try {
      await api.put(`/feedback/complaints/${id}/resolve`, {
        status: 'RESOLVED',
        adminResponse,
      });
      toast.success('तक्रार यशस्वीरित्या निवारण केली!');
      fetchData();
    } catch (err) {
      toast.error('कृती अयशस्वी झाली');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <span>ग्राहक अभिप्राय व तक्रार निवारण (Feedback)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • जेवणाचा दर्जा, रेटिंग्ज आणि ग्राहकांच्या तक्रारींचे तात्काळ निवारण
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <div>
            <div className="text-xs font-bold text-slate-900 font-mono">{avgRating} / ५.० रेटिंग</div>
            <div className="text-[10px] text-slate-400 font-medium">एकूण {feedbacks.length} पुनरावलोकने</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'complaints'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          तक्रारी व अडचणी ({complaints.filter((c) => c.status === 'OPEN').length} प्रलंबित)
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'feedback'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ग्राहकांचे अभिप्राय व रेटिंग्ज ({feedbacks.length})
        </button>
      </div>

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-xs text-slate-500 font-medium">तक्रारी लोड होत आहेत...</div>
          ) : complaints.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <div key={c.id} className="p-6 space-y-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                        {c.complaintNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{c.customer?.name} ({c.customer?.customerCode})</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {c.category === 'FOOD_QUALITY'
                          ? 'जेवण दर्जा'
                          : c.category === 'HYGIENE'
                          ? 'स्वच्छता'
                          : c.category === 'TIMING'
                          ? 'वेळ'
                          : c.category === 'BILLING'
                          ? 'बिलिंग'
                          : 'इतर'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {c.status === 'RESOLVED' ? 'निवारण झाले' : 'प्रलंबित'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{c.subject}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{c.description}</p>
                  </div>

                  {c.adminResponse && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-slate-700 block">व्यवस्थापनाचे उत्तर:</span>
                      <p className="text-slate-600 italic">{c.adminResponse}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                    <span>नोंदणी दिनांक: {new Date(c.createdAt).toLocaleString('mr-IN')}</span>
                    {c.status === 'OPEN' && (
                      <button
                        onClick={() => handleResolveComplaint(c.id)}
                        className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all"
                      >
                        उत्तर द्या व निवारण करा
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">कोणतीही प्रलंबित तक्रार नाही! सर्व ग्राहक समाधानी आहेत.</p>
            </div>
          )}
        </div>
      )}

      {/* Ratings & Reviews Tab */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-xs text-slate-500 font-medium">अभिप्राय लोड होत आहेत...</div>
          ) : feedbacks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {feedbacks.map((f) => (
                <div key={f.id} className="p-6 space-y-2 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{f.customer?.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({f.mealType || 'जेवण अभिप्राय'} • {f.mealDate || 'नुकताच'})</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      {'★'.repeat(f.rating)}
                      <span className="text-xs font-bold text-slate-700 ml-1">({f.rating}/५)</span>
                    </div>
                  </div>

                  {f.comments && (
                    <p className="text-xs text-slate-600 italic">"{f.comments}"</p>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1">
                    दिनांक: {new Date(f.createdAt).toLocaleDateString('mr-IN')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs font-medium">अद्याप कोणताही अभिप्राय प्राप्त नाही.</div>
          )}
        </div>
      )}
    </div>
  );
};
