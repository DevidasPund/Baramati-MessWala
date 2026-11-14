import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CustomerFeedbackPage = () => {
  const [activeTab, setActiveTab] = useState('rate'); // 'rate' or 'complaint'
  const [rating, setRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [hygieneRating, setHygieneRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Complaint State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FOOD_QUALITY');
  const [myComplaints, setMyComplaints] = useState([]);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/feedback/complaints');
      if (res?.data?.complaints) {
        setMyComplaints(res.data.complaints);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      const res = await api.post('/feedback/feedback', {
        rating,
        foodQualityRating: foodRating,
        hygieneRating,
        comments,
      });
      toast.success(res.message || 'Thank you for your rating!');
      setComments('');
    } catch (err) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      toast.error('Subject and description are required');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const res = await api.post('/feedback/complaints', { subject, description, category });
      toast.success(res.message || 'Complaint submitted');
      setSubject('');
      setDescription('');
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Feedback & Support Desk</h2>
        <p className="text-xs text-slate-500">Rate your dining experience or raise complaints for prompt resolution</p>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('rate')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'rate' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
          }`}
        >
          Rate Today's Meal
        </button>
        <button
          onClick={() => setActiveTab('complaint')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'complaint' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
          }`}
        >
          File a Complaint / Issue ({myComplaints.length})
        </button>
      </div>

      {activeTab === 'rate' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900">How Was Your Food Today?</h3>
            <p className="text-xs text-slate-500">Your ratings directly guide our head chef's daily kitchen preparation.</p>
          </div>

          <form onSubmit={handleSubmitRating} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">Overall Experience</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-bold text-slate-700 ml-2">{rating} of 5 Stars</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Taste & Quality</label>
                <select
                  value={foodRating}
                  onChange={(e) => setFoodRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Needs improvement</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Dining Hygiene</label>
                <select
                  value={hygieneRating}
                  onChange={(e) => setHygieneRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value={5}>5 - Spotless Clean</option>
                  <option value={4}>4 - Clean</option>
                  <option value={3}>3 - Acceptable</option>
                  <option value={2}>2 - Needs attention</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Comments & Suggestions</label>
              <textarea
                rows={3}
                placeholder="Let us know what you loved or what we can cook better..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRating}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submittingRating ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'complaint' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-5">
            <h3 className="font-bold text-sm text-slate-900">Submit a Complaint</h3>
            <p className="text-xs text-slate-500">Every issue is assigned a unique complaint tracking number and reviewed by management.</p>

            <form onSubmit={handleSubmitComplaint} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FOOD_QUALITY">Food Quality / Taste</option>
                    <option value="HYGIENE">Hygiene & Cleanliness</option>
                    <option value="TIMING">Meal Timings</option>
                    <option value="BILLING">Billing & Accounts</option>
                    <option value="STAFF_BEHAVIOR">Staff Behavior</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Too much spice in dinner curry"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what occurred, date and meal timing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComplaint}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {submittingComplaint ? 'Registering...' : 'Register Complaint'}
              </button>
            </form>
          </div>

          {/* List of my past complaints */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
              My Registered Complaints ({myComplaints.length})
            </div>
            {myComplaints.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {myComplaints.map((c) => (
                  <div key={c.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-700">{c.complaintNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{c.subject}</div>
                    <p className="text-slate-600 text-[11px]">{c.description}</p>
                    {c.adminResponse && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-emerald-900 font-medium text-[11px]">
                        <strong>Response:</strong> {c.adminResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No complaints registered.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
