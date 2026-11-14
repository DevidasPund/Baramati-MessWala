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
      toast.error('Failed to load notifications');
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
      toast.error('Title and message are required');
      return;
    }

    setBroadcasting(true);
    try {
      const res = await api.post('/notifications/broadcast', { title, message, targetGroup });
      toast.success(res.message || 'Announcement broadcast queued!');
      setTitle('');
      setMessage('');
      fetchNotifications();
    } catch (err) {
      toast.error(err.message || 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Notifications & WhatsApp Broadcasts</h2>
        <p className="text-xs text-slate-500">
          Send announcements, payment reminders, and track message dispatch history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Broadcast Announcement Form (Left) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Send className="w-4 h-4 text-emerald-600" />
            <span>Send New Announcement</span>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Target Audience</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Registered Customers</option>
                <option value="ACTIVE">Active Members Only</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Announcement Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Special Sunday Sweet Feast Announcement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Message Content *</label>
              <textarea
                rows={4}
                required
                placeholder="Type your WhatsApp notification text here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {broadcasting ? 'Broadcasting...' : 'Broadcast Notification'}
            </button>
          </form>
        </div>

        {/* Notification Logs (Right) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Dispatched Notifications</h3>
            <span className="text-[10px] font-bold text-slate-400">Total {notifications.length} Logs</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notification logs...</div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="p-4 hover:bg-slate-50/70 rounded-2xl transition-colors space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.deliveryStatus === 'SENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {n.deliveryStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Recipient: <strong>{n.customer?.name}</strong> ({n.customer?.phone})</span>
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No notifications dispatched yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
