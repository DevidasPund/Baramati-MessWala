import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, Loader2, CheckCircle2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const InitialPasswordChangeModal = ({ isOpen }) => {
  const { user, login, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const phoneDigits = (user?.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('कृपया सध्याचा पासवर्ड (तुमचा मोबाइल नंबर) प्रविष्ट करा.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('नवीन पासवर्ड किमान ६ अक्षरे किंवा अंकांचा असणे आवश्यक आहे.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('नवीन पासवर्ड आणि पुष्टीकरण पासवर्ड जुळत नाहीत.');
      return;
    }

    if (phoneDigits && (newPassword === phoneDigits || newPassword === user?.customer?.phone)) {
      toast.error('सुरक्षिततेसाठी नवीन पासवर्ड तुमचा मोबाइल नंबर असू शकत नाही. कृपया वेगळा पासवर्ड ठेवा.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res?.data?.token) {
        const updatedUser = {
          ...user,
          mustChangePassword: false,
          customer: user?.customer ? { ...user.customer, mustChangePassword: false } : null,
        };
        login(res.data.token, updatedUser);
        toast.success('पासवर्ड यशस्वीरीत्या बदलला आहे! आता आपण डॅशबोर्ड वापरू शकता. 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'पासवर्ड बदलताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4 font-['Noto_Sans_Devanagari',sans-serif]">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            पासवर्ड बदलणे आवश्यक आहे
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            सुरक्षिततेसाठी पहिल्या लॉगिननंतर नवीन पासवर्ड सेट करा
          </p>
        </div>

        {/* Required Marathi Notice Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-blue-950 mb-0.5">महत्त्वाची सूचना:</span>
            <p className="leading-relaxed font-medium">
              तुमचा सुरुवातीचा पासवर्ड तुमचा मोबाइल नंबर आहे. सुरक्षिततेसाठी पहिल्या लॉगिननंतर पासवर्ड बदला.
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              सध्याचा पासवर्ड / PIN (तुमचा मोबाइल नंबर) *
            </label>
            <div className="relative flex items-center">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="उदा. 9822334455"
                className="w-full pl-3.5 pr-10 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              नवीन पासवर्ड (New Password) *
            </label>
            <div className="relative flex items-center">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="किमान ६ अक्षरे किंवा अंक"
                className="w-full pl-3.5 pr-10 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              नवीन पासवर्ड मोबाइल नंबरपेक्षा वेगळा असावा.
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              नवीन पासवर्ड पुष्टी करा (Confirm New Password) *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="नवीन पासवर्ड पुन्हा टाका"
              className="w-full px-3.5 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>पासवर्ड सेव्ह करत आहे...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>सुरक्षित नवीन पासवर्ड सेव्ह करा</span>
              </>
            )}
          </button>
        </form>

        {/* Logout Fallback Link */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>खात्यातून बाहेर पडा (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
