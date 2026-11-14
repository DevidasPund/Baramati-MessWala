import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle, CheckCircle2, Clock, Send, ThumbsUp } from 'lucide-react';
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
      toast.success(res.message || 'आपल्या बहुमूल्य अभिप्रायाबद्दल धन्यवाद!');
      setComments('');
    } catch (err) {
      toast.error('अभिप्राय नोंदवता आला नाही.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      toast.error('विषय आणि तपशील भरणे आवश्यक आहे');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const res = await api.post('/feedback/complaints', {
        subject,
        description,
        category,
      });
      toast.success(res.message || 'तक्रार यशस्वीरित्या नोंदवली गेली. प्रशासन लवकरच संपर्क करेल.');
      setSubject('');
      setDescription('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'तक्रार नोंदवता आली नाही');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <span>अभिप्राय व तक्रार निवारण</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          आपला अनुभव शेअर करा किंवा सेवेबद्दल तक्रार असल्यास बारामती मेस व्यवस्थापनाला कळवा
        </p>
      </div>

      {/* Segment Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('rate')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rate'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⭐ जेवणाचा अभिप्राय द्या
        </button>
        <button
          onClick={() => setActiveTab('complaint')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'complaint'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⚠️ तक्रार नोंदवा
        </button>
      </div>

      {/* Tab 1: Rating Form */}
      {activeTab === 'rate' && (
        <form onSubmit={handleSubmitRating} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                एकूण जेवणाचा अनुभव (Overall Rating)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  अन्नाचा दर्जा (Food Quality): {foodRating}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={foodRating}
                  onChange={(e) => setFoodRating(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  स्वच्छता (Hygiene): {hygieneRating}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={hygieneRating}
                  onChange={(e) => setHygieneRating(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                तुमच्या प्रतिक्रिया किंवा सुधारणा सूचना:
              </label>
              <textarea
                rows="4"
                placeholder="जेवणाची चव कशी वाटली? पोळ्या, आमटी, भाज्यांबद्दल आपले मत लिहा..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-sans"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingRating}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submittingRating ? 'पाठवत आहे...' : 'अभिप्राय पाठवा'}</span>
          </button>
        </form>
      )}

      {/* Tab 2: Complaint Form & List */}
      {activeTab === 'complaint' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmitComplaint} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                तक्रारीचा प्रकार (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
              >
                <option value="FOOD_QUALITY">जेवणाचा दर्जा / चव</option>
                <option value="HYGIENE">स्वच्छता किंवा भांडी</option>
                <option value="TIMING">जेवणाची वेळ / उशीर</option>
                <option value="STAFF_BEHAVIOR">कर्मचाऱ्यांचे वर्तन</option>
                <option value="BILLING">बिल किंवा पेमेंट प्रश्न</option>
                <option value="OTHER">इतर तक्रार</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                तक्रारीचा विषय (Subject)
              </label>
              <input
                type="text"
                placeholder="उदा. पोळ्या वेळेवर उपलब्ध नव्हत्या"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                तपशील (Detailed Description)
              </label>
              <textarea
                rows="4"
                placeholder="नेमकी काय अडचण आली ते सविस्तर लिहा..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submittingComplaint}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{submittingComplaint ? 'नोंद होत आहे...' : 'तक्रार दाखल करा'}</span>
            </button>
          </form>

          {/* Previous Complaints */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              मागील तक्रारींची स्थिती
            </h3>
            {myComplaints.length > 0 ? (
              myComplaints.map((c) => (
                <div key={c.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{c.subject}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.status === 'RESOLVED' ? 'निवारण झाले' : 'प्रलंबित'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{c.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium">कोणतीही प्रलंबित तक्रार नाही.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
