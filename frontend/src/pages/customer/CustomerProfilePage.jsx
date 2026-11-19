import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Lock, Save, ShieldCheck, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerProfilePage = () => {
  const { user, updateUser } = useAuth();
  const customer = user?.customer;

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || user?.email || '',
    address: customer?.address || '',
    emergencyContact: customer?.emergencyContact || '',
  });

  const [saving, setSaving] = useState(false);

  // Password change state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPass, setChangingPass] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passData.currentPassword || !passData.newPassword) {
      toast.error('कृपया सध्याचा आणि नवीन पासवर्ड प्रविष्ट करा.');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('नवीन पासवर्ड आणि पुष्टीकरण पासवर्ड जुळत नाहीत.');
      return;
    }
    if (passData.newPassword.length < 6) {
      toast.error('नवीन पासवर्ड किमान ६ अक्षरांचा असावा.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await api.post('/auth/change-password', passData);
      toast.success(res?.message || 'पासवर्ड यशस्वीरीत्या बदलला आहे!');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (res?.data?.token) {
        localStorage.setItem('messmate_token', res.data.token);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'पासवर्ड बदलता आला नाही.');
    } finally {
      setChangingPass(false);
    }
  };

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || user?.email || '',
        address: customer.address || '',
        emergencyContact: customer.emergencyContact || '',
      });
    }
  }, [customer]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/update-profile', formData);
      toast.success(res.message || 'प्रोफाइल माहिती यशस्वीरित्या अद्यतनित केली!');
      if (res?.data?.customer) {
        updateUser({ customer: res.data.customer });
      }
    } catch (err) {
      toast.error(err.message || 'प्रोफाइल अद्यतनित करता आली नाही');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          <span>माझे सभासद प्रोफाइल</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          आपला मोबाईल क्रमांक, पत्ता आणि आणीबाणी संपर्क अद्यतनित करा
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
            {customer?.name?.charAt(0) || 'म'}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{customer?.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                {customer?.customerCode}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">बारामती मेसवाला सभासद</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                पूर्ण नाव (Full Name)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                मोबाईल क्रमांक (Phone Number)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ईमेल पत्ता (Email)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                आणीबाणी संपर्क / पालकांचा फोन
              </label>
              <input
                type="tel"
                placeholder="पालक / रूममेट फोन नंबर"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              स्थानिक राहण्याचा पत्ता / वसतिगृह / रूम क्र.
            </label>
            <textarea
              rows="3"
              placeholder="रूम नंबर, हॉस्टेल / बिल्डिंगचे नाव, अहिल्यानगर"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'अद्यतनित होत आहे...' : 'प्रोफाइल सेव्ह करा'}</span>
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">सुरक्षितता व पासवर्ड बदला</h2>
            <p className="text-xs text-slate-500">आपला लॉगिन पासवर्ड अद्यतनित करा</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              सध्याचा पासवर्ड / PIN *
            </label>
            <input
              type="password"
              required
              value={passData.currentPassword}
              onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
              placeholder="सध्याचा पासवर्ड प्रविष्ट करा"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                नवीन पासवर्ड *
              </label>
              <input
                type="password"
                required
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                placeholder="किमान ६ अक्षरे किंवा अंक"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                नवीन पासवर्ड पुष्टी करा *
              </label>
              <input
                type="password"
                required
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                placeholder="पुन्हा पासवर्ड प्रविष्ट करा"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all"
          >
            {changingPass ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>पासवर्ड बदलत आहे...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>पासवर्ड अद्यतनित करा</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
