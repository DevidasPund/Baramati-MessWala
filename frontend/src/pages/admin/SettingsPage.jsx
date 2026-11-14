import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, IndianRupee, Clock, Smartphone, MapPin, Building, HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    businessName: 'Baramati Messwala',
    tagline: 'Manage Your Mess, The Smart Way!',
    phone: '92091 84035',
    email: 'contact@baramatimesswala.com',
    address: 'Shriram Chowk, Pipeline Road, Ahilyanagar, Maharashtra, India',
    googleMapsUrl: 'https://maps.google.com/?q=Shriram+Chowk+Pipeline+Road+Ahilyanagar',
    upiId: 'baramatimesswala@upi',
    upiPayeeName: 'Baramaticha Dabewala',
    breakfastStartTime: '08:00',
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
          setSettings((prev) => ({
            ...prev,
            ...res.data.settings,
            // Ensure official brand details are preserved
            upiPayeeName: res.data.settings.upiPayeeName || 'Baramaticha Dabewala',
            phone: res.data.settings.phone || '92091 84035',
            address: res.data.settings.address || 'Shriram Chowk, Pipeline Road, Ahilyanagar, Maharashtra, India',
          }));
        }
      } catch (err) {
        toast.error('सेटिंग्ज लोड करता आल्या नाहीत');
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
      toast.success(res.message || 'सर्व व्यावसायिक सेटिंग्ज यशस्वीरित्या सेव्ह केल्या!');
    } catch (err) {
      toast.error(err.message || 'सेटिंग्ज जतन करता आल्या नाहीत');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>मेस व्यावसायिक व सिस्टीम सेटिंग्ज (Settings)</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          बारामती मेस माहिती, अधिकृत UPI बिलिंग (बारामतीचा डबेवाला), जेवणाच्या वेळा आणि WhatsApp Cloud API
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Identity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <span>मेस व्यवसाय ब्रँडिंग व संपर्क माहिती</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">मेस व्यवसायाचे नाव</label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">टॅगलाइन (Tagline)</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">हेल्पलाइन फोन क्रमांक</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">अधिकृत संपर्क ईमेल</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">मेस प्रत्यक्ष पत्ता</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* UPI Payments Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>अधिकृत PhonePe / UPI पेमेंट माहिती आणि अतिरिक्त जेवण दर</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">मेस UPI ID</label>
              <input
                type="text"
                required
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">अधिकृत पेयी नाव (UPI Payee Name)</label>
              <input
                type="text"
                required
                value={settings.upiPayeeName}
                onChange={(e) => setSettings({ ...settings, upiPayeeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">अतिरिक्त नाश्ता दर (₹)</label>
              <input
                type="number"
                value={settings.extraBreakfastPrice}
                onChange={(e) => setSettings({ ...settings, extraBreakfastPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">अतिरिक्त दुपार जेवण दर (₹)</label>
              <input
                type="number"
                value={settings.extraLunchPrice}
                onChange={(e) => setSettings({ ...settings, extraLunchPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">अतिरिक्त रात्र जेवण दर (₹)</label>
              <input
                type="number"
                value={settings.extraDinnerPrice}
                onChange={(e) => setSettings({ ...settings, extraDinnerPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">पाहुणे थाळी दर (Guest Meal ₹)</label>
              <input
                type="number"
                value={settings.guestMealPrice}
                onChange={(e) => setSettings({ ...settings, guestMealPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Meal Timings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>दैनिक मेस सेवा वेळा (Kitchen Timings)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">नाश्ता सुरु</label>
              <input
                type="time"
                value={settings.breakfastStartTime}
                onChange={(e) => setSettings({ ...settings, breakfastStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">नाश्ता समाप्त</label>
              <input
                type="time"
                value={settings.breakfastEndTime}
                onChange={(e) => setSettings({ ...settings, breakfastEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">दुपार जेवण सुरु</label>
              <input
                type="time"
                value={settings.lunchStartTime}
                onChange={(e) => setSettings({ ...settings, lunchStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">दुपार जेवण समाप्त</label>
              <input
                type="time"
                value={settings.lunchEndTime}
                onChange={(e) => setSettings({ ...settings, lunchEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">रात्रीचे जेवण सुरु</label>
              <input
                type="time"
                value={settings.dinnerStartTime}
                onChange={(e) => setSettings({ ...settings, dinnerStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">रात्रीचे जेवण समाप्त</label>
              <input
                type="time"
                value={settings.dinnerEndTime}
                onChange={(e) => setSettings({ ...settings, dinnerEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Business API */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Cloud API संरचना</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="waToggle"
                checked={settings.whatsappEnabled}
                onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label htmlFor="waToggle" className="font-bold text-slate-800">लाइव्ह Cloud API सक्षम करा</label>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            हे बंद असताना किंवा माहिती रिक्त असल्यास, MessMate मधील इनबिल्ट <strong>मॉक नोटिफिकेशन प्रोव्हायडर</strong> वापरले जाते, ज्याद्वारे ग्राहकांच्या ॲपमधील इनबॉक्समध्ये सर्व सूचना तात्काळ सिंक होतात.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">फोन नंबर ID (Phone Number ID)</label>
              <input
                type="text"
                placeholder="उदा. 1029384756"
                value={settings.whatsappPhoneId || ''}
                onChange={(e) => setSettings({ ...settings, whatsappPhoneId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">बिझनेस अकाउंट ID</label>
              <input
                type="text"
                placeholder="उदा. 9876543210"
                value={settings.whatsappAccountId || ''}
                onChange={(e) => setSettings({ ...settings, whatsappAccountId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">सिस्टीम ॲक्सेस टोकन (System Access Token)</label>
              <input
                type="password"
                placeholder="EAAG..."
                value={settings.whatsappAccessToken || ''}
                onChange={(e) => setSettings({ ...settings, whatsappAccessToken: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-blue-600" />
            <span>प्रणाली विकासक: <strong className="text-slate-900 font-bold">देविदास पुंड (Devidas Pund)</strong></span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">MessMate Production v1.0.0</span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'सेटिंग्ज जतन होत आहेत...' : 'सर्व सेटिंग्ज सेव्ह करा'}</span>
        </button>
      </form>
    </div>
  );
};
