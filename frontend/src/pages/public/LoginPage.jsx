import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pending approval notice modal
  const [pendingNotice, setPendingNotice] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Unified Mobile Number + Password / PIN Login (Owner & Customer)
  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (cleanPhone.length !== 10) {
      toast.error('कृपया वैध १०-अंकी भारतीय मोबाइल नंबर प्रविष्ट करा.');
      return;
    }

    if (!password) {
      toast.error('कृपया आपला पासवर्ड किंवा PIN प्रविष्ट करा.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        phone: cleanPhone,
        emailOrPhone: cleanPhone,
        password: password,
      });

      if (res?.data?.token) {
        login(res.data.token, res.data.user);
        toast.success(`स्वागत आहे, ${res.data.user.customer?.name || 'वापरकर्ता'}!`);

        // Automatic Role Redirection: OWNER (SUPER_ADMIN/ADMIN) vs CUSTOMER
        if (['SUPER_ADMIN', 'ADMIN'].includes(res.data.user.role)) {
          navigate('/admin/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'PENDING_APPROVAL') {
        setPendingNotice({
          name: resp.customer?.name,
          phone: resp.customer?.phone,
          message: resp.message,
        });
      } else {
        toast.error(resp?.message || 'मोबाइल नंबर किंवा पासवर्ड चुकीचा आहे.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-['Noto_Sans_Devanagari',sans-serif] selection:bg-[#2864ED] selection:text-white"
      style={{
        background: 'linear-gradient(135deg, #5865F2 0%, #7B2FE8 100%)',
      }}
    >
      {/* Login Card */}
      <div className="w-full max-w-[450px] bg-white rounded-[20px] p-6 sm:p-8 shadow-2xl shadow-indigo-950/25 border border-white/20 transition-all">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-3xl mb-3 shadow-xs">
            <span role="img" aria-label="mess-icon">
              🍽️
            </span>
          </div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight leading-snug">
            मेस हजेरी प्रणाली
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Login to continue
          </p>
        </div>

        {/* PRIMARY FORM: MOBILE NUMBER + PASSWORD / PIN */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              मोबाइल नंबर
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-0 inset-y-0 flex items-center pl-3.5 pr-2.5 border-r border-gray-200 pointer-events-none text-gray-600 font-bold text-sm bg-gray-100/60 rounded-l-xl">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="१०-अंकी मोबाइल नंबर प्रविष्ट करा"
                className="w-full pl-16 pr-4 h-[50px] bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2864ED]/30 focus:border-[#2864ED] transition-all"
              />
            </div>
          </div>

          {/* Password / PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                पासवर्ड / PIN
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#2864ED] hover:underline transition-colors"
              >
                पासवर्ड विसरलात?
              </Link>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="आपला पासवर्ड किंवा PIN टाका"
                className="w-full pl-4 pr-11 h-[50px] bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2864ED]/30 focus:border-[#2864ED] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                aria-label={showPassword ? 'पासवर्ड लपवा' : 'पासवर्ड दाखवा'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#2864ED] hover:bg-[#1e54cc] active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-md shadow-[#2864ED]/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>लॉगिन होत आहे...</span>
              </>
            ) : (
              <span>🔐 Login</span>
            )}
          </button>
        </form>

        {/* Footer Text */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2.5">
          <p className="text-xs font-medium text-gray-500">
            मालक किंवा ग्राहक – एकाच Login पेजवरून
          </p>

          <div className="text-xs text-gray-600">
            नवीन ग्राहक आहात?{' '}
            <Link
              to="/register"
              className="font-bold text-[#2864ED] hover:underline transition-colors"
            >
              येथे नोंदणी करा
            </Link>
          </div>
        </div>
      </div>

      {/* PENDING APPROVAL MODAL */}
      {pendingNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">नोंदणी मंजुरीच्या प्रतीक्षेत!</h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              {pendingNotice.message ||
                'आपली नोंदणी यशस्वीरीत्या प्राप्त झाली आहे. मेस मालकाच्या मंजुरीनंतर आपले खाते सुरू केले जाईल.'}
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>
                ग्राहक: <span className="font-bold">{pendingNotice.name || 'ग्राहक'}</span>
              </div>
              <div>
                मोबाइल: <span className="font-bold">{pendingNotice.phone}</span>
              </div>
              <div className="text-[11px] text-amber-700 font-bold">स्थिती: PENDING_APPROVAL</div>
            </div>

            <button
              type="button"
              onClick={() => setPendingNotice(null)}
              className="w-full h-11 bg-[#2864ED] hover:bg-[#1e54cc] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              समजले (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
