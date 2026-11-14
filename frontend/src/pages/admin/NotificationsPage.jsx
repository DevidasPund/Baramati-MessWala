import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle2, MessageSquare, Smartphone, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState('ALL');
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=30');
      if (res?.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      toast.error('सूचना लॉग लोड करता आले नाहीत');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('शीर्षक आणि संदेश आवश्यक आहेत');
      return;
    }

    setBroadcasting(true);
    try {
      const res = await api.post('/notifications/broadcast', { title, message, targetGroup });
      toast.success(res.message || 'WhatsApp ब्रॉडकास्ट सूचना यशस्वीरित्या पाठवली!');
      setTitle('');
      setMessage('');
      fetchNotifications();
    } catch (err) {
      toast.error(err.message || 'ब्रॉडकास्ट पाठवता आले नाही');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          <span>सूचना व WhatsApp ब्रॉडकास्ट (Notifications)</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          बारामती मेसवाला • ग्राहकांना सामान्य घोषणा, सुट्टीच्या सूचना, स्मरणपत्रे आणि WhatsApp वितरण इतिहास
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Broadcast Announcement Form (Left) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Send className="w-4 h-4 text-blue-600" />
            <span>नवीन घोषणा / संदेश पाठवा</span>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">लक्षित ग्राहक वर्ग (Target Audience)</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">सर्व नोंदणीकृत ग्राहक (All)</option>
                <option value="ACTIVE">केवळ चालू सक्रिय सभासद (Active Only)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">घोषणेचे शीर्षक *</label>
              <input
                type="text"
                required
                placeholder="उदा. रविवार विशेष मेजवानी / मेस सुट्टी सूचना"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">संदेश तपशील *</label>
              <textarea
                rows={4}
                required
                placeholder="येथे संदेश लिहा... उदा. सर्व सभासदांना कळवण्यात येते की उद्या रविवारी दुपारी १२:०० ते ३:३० पर्यंत पुरणपोळी व कटाची आमटी विशेष मेजवानी राहील."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{broadcasting ? 'ब्रॉडकास्ट होत आहे...' : 'सर्व सदस्यांना पाठवा'}</span>
            </button>
          </form>
        </div>

        {/* Notification Logs (Right) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">पाठवलेल्या सूचनांचा इतिहास (Logs)</h3>
            <span className="text-[10px] font-bold text-slate-400">एकूण {notifications.length} नोंदी</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">लॉग लोड होत आहेत...</div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="p-4 hover:bg-slate-50/70 rounded-2xl transition-colors space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.deliveryStatus === 'SENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {n.deliveryStatus === 'SENT' ? 'पाठवले' : n.deliveryStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>प्राप्तकर्ता: <strong>{n.customer?.name}</strong> ({n.customer?.phone})</span>
                    <span>{new Date(n.createdAt).toLocaleString('mr-IN')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">अद्याप कोणताही संदेश पाठवला नाही.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
