import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, IndianRupee, Clock, Smartphone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    businessName: 'Baramati Messwala',
    tagline: 'Manage Your Mess, The Smart Way!',
    phone: '+91 9822334455',
    email: 'contact@baramatimesswala.com',
    address: 'Shop No. 4, College Corner, Vidyanagari, Baramati, Maharashtra 413133',
    googleMapsUrl: 'https://maps.google.com/?q=Baramati+Messwala',
    upiId: 'baramatimesswala@upi',
    upiPayeeName: 'Baramati Messwala',
    breakfastStartTime: '07:30',
    breakfastEndTime: '10:00',
    lunchStartTime: '12:00',
    lunchEndTime: '15:00',
    dinnerStartTime: '19:30',
    dinnerEndTime: '22:30',
    extraBreakfastPrice: 40,
    extraLunchPrice: 90,
    extraDinnerPrice: 90,
    guestMealPrice: 110,
    expiryReminderDays: '7,3,1',
    whatsappEnabled: false,
    whatsappAccessToken: '',
    whatsappPhoneId: '',
    whatsappAccountId: '',
    whatsappApiVersion: 'v21.0',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res?.data?.settings) {
          setSettings((prev) => ({ ...prev, ...res.data.settings }));
        }
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      toast.success(res.message || 'Settings saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Business & System Settings</h2>
        <p className="text-xs text-slate-500">
          Configure mess business identity, meal schedules, UPI billing credentials, and WhatsApp Cloud API
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Identity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>Business Branding & Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Business Name</label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Helpline Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* UPI Payments Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>UPI Payments & Add-on Meal Pricing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Business UPI ID</label>
              <input
                type="text"
                required
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">UPI Payee Name</label>
              <input
                type="text"
                required
                value={settings.upiPayeeName}
                onChange={(e) => setSettings({ ...settings, upiPayeeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Extra Breakfast Price (₹)</label>
              <input
                type="number"
                value={settings.extraBreakfastPrice}
                onChange={(e) => setSettings({ ...settings, extraBreakfastPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Extra Lunch Price (₹)</label>
              <input
                type="number"
                value={settings.extraLunchPrice}
                onChange={(e) => setSettings({ ...settings, extraLunchPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Extra Dinner Price (₹)</label>
              <input
                type="number"
                value={settings.extraDinnerPrice}
                onChange={(e) => setSettings({ ...settings, extraDinnerPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Guest Meal Charge (₹)</label>
              <input
                type="number"
                value={settings.guestMealPrice}
                onChange={(e) => setSettings({ ...settings, guestMealPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Meal Timings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Daily Kitchen Service Timings</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Breakfast Start</label>
              <input
                type="time"
                value={settings.breakfastStartTime}
                onChange={(e) => setSettings({ ...settings, breakfastStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Breakfast End</label>
              <input
                type="time"
                value={settings.breakfastEndTime}
                onChange={(e) => setSettings({ ...settings, breakfastEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Lunch Start</label>
              <input
                type="time"
                value={settings.lunchStartTime}
                onChange={(e) => setSettings({ ...settings, lunchStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Lunch End</label>
              <input
                type="time"
                value={settings.lunchEndTime}
                onChange={(e) => setSettings({ ...settings, lunchEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Dinner Start</label>
              <input
                type="time"
                value={settings.dinnerStartTime}
                onChange={(e) => setSettings({ ...settings, dinnerStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Dinner End</label>
              <input
                type="time"
                value={settings.dinnerEndTime}
                onChange={(e) => setSettings({ ...settings, dinnerEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Business API */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Cloud API Configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="waToggle"
                checked={settings.whatsappEnabled}
                onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <label htmlFor="waToggle" className="font-bold text-slate-800">Enable Live Cloud API</label>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            When disabled or credentials are blank, MessMate utilizes the built-in <strong>Mock Notification Provider</strong> with full audit logging and customer inbox synchronization.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number ID</label>
              <input
                type="text"
                placeholder="e.g. 1029384756"
                value={settings.whatsappPhoneId || ''}
                onChange={(e) => setSettings({ ...settings, whatsappPhoneId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Business Account ID</label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={settings.whatsappAccountId || ''}
                onChange={(e) => setSettings({ ...settings, whatsappAccountId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">System Access Token</label>
              <input
                type="password"
                placeholder="EAAG..."
                value={settings.whatsappAccessToken || ''}
                onChange={(e) => setSettings({ ...settings, whatsappAccessToken: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving System Changes...' : 'Save All Settings'}</span>
        </button>
      </form>
    </div>
  );
};
