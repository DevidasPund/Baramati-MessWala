import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Loader2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { auth, isFirebaseClientConfigured } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export const LoginPage = () => {
  const [authMode, setAuthMode] = useState('PASSWORD'); // 'PASSWORD' or 'OTP'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Firebase OTP specific states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Pending approval notice modal
  const [pendingNotice, setPendingNotice] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  // 60-second cooldown timer for SMS OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Clean up reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Standard Password / PIN Login
  const handlePasswordLogin = async (e) => {
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
      } else if (resp?.code === 'PHONE_VERIFICATION_REQUIRED') {
        toast.error(resp.message || 'आपला मोबाइल नंबर अद्याप SMS OTP द्वारे प्रमाणित नाही.');
        setAuthMode('OTP');
      } else {
        toast.error(resp?.message || 'मोबाइल नंबर किंवा पासवर्ड चुकीचा आहे.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Send Firebase SMS OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length !== 10) {
      toast.error('कृपया वैध १०-अंकी भारतीय मोबाइल नंबर प्रविष्ट करा.');
      return;
    }

    const fullPhoneNumber = `+91${clean}`;

    if (!isFirebaseClientConfigured || !auth) {
      toast.error('Firebase SMS OTP अद्याप कॉन्फिगर केलेले नाही. कृपया पासवर्ड / PIN ने लॉगिन करा.');
      setAuthMode('PASSWORD');
      return;
    }

    setLoading(true);

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            toast.error('reCAPTCHA कालबाह्य झाले. कृपया पुन्हा प्रयत्न करा.');
          },
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendCooldown(60);
      toast.success(`SMS OTP ${fullPhoneNumber} वर पाठवला गेला आहे.`);
    } catch (err) {
      console.error('Firebase Phone Auth Error:', err);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }

      if (err.code === 'auth/invalid-phone-number') {
        toast.error('अवैध मोबाइल नंबर. कृपया योग्य १०-अंकी नंबर टाका.');
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('खूप जास्त विनंत्या झाल्या आहेत. कृपया थोड्या वेळाने प्रयत्न करा किंवा पासवर्डने लॉगिन करा.');
      } else if (err.code === 'auth/quota-exceeded') {
        toast.error('SMS कोटा संपला आहे. कृपया पासवर्डने लॉगिन करा.');
      } else {
        toast.error(err.message || 'SMS OTP पाठवण्यात त्रुटी आली.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify Firebase SMS OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      toast.error('कृपया एसएमएस मध्ये आलेला वैध ६-अंकी OTP टाका.');
      return;
    }

    if (!confirmationResult) {
      toast.error('कृपया प्रथम "OTP मिळवा" बटणावर क्लिक करा.');
      return;
    }

    setLoading(true);
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    const fullPhoneNumber = `+91${clean}`;

    try {
      let idToken = null;
      try {
        const userCred = await confirmationResult.confirm(cleanOtp);
        idToken = await userCred.user.getIdToken();
      } catch (firebaseOtpErr) {
        console.error('OTP confirmation error:', firebaseOtpErr);
        if (firebaseOtpErr.code === 'auth/invalid-verification-code') {
          toast.error('चुकीचा OTP कोड! कृपया एसएमएस मध्ये आलेला ६-अंकी OTP तपासून टाका.');
        } else if (firebaseOtpErr.code === 'auth/code-expired') {
          toast.error('हा OTP कालबाह्य झाला आहे. कृपया नवीन OTP मागवा.');
        } else {
          toast.error(firebaseOtpErr.message || 'चुकीचा OTP कोड.');
        }
        setLoading(false);
        return;
      }

      // Backend token verification
      const res = await api.post('/auth/firebase-login', {
        idToken,
        phoneNumber: fullPhoneNumber,
        role: 'CUSTOMER', // Default to Customer; backend resolves Owner automatically if authorized phone
      });

      if (res?.data?.token) {
        login(res.data.token, res.data.user);
        toast.success(`स्वागत आहे, ${res.data.user.customer?.name || 'वापरकर्ता'}!`);

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
      } else if (resp?.code === 'REGISTRATION_REQUIRED') {
        toast.error('या नंबरवर खाते आढळले नाही. कृपया प्रथम नोंदणी करा.');
        navigate(`/register?phone=${clean}`);
      } else {
        toast.error(resp?.message || 'लॉगिन अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.');
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
      <div id="recaptcha-container"></div>

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
        {authMode === 'PASSWORD' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
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

            {/* Optional OTP Switch */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('OTP');
                  setOtpSent(false);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-[#2864ED] transition-colors"
              >
                किंवा SMS OTP द्वारे लॉगिन करा →
              </button>
            </div>
          </form>
        ) : (
          /* OPTIONAL FIREBASE PHONE OTP FORM */
          <div className="space-y-5">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    नोंदणीकृत मोबाइल नंबर
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
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="१०-अंकी मोबाइल नंबर टाका"
                      className="w-full pl-16 pr-4 h-[50px] bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2864ED]/30 focus:border-[#2864ED] transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    या नंबरवर सुरक्षित SMS OTP पाठवला जाईल.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] bg-[#2864ED] hover:bg-[#1e54cc] active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-md shadow-[#2864ED]/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>OTP पाठवत आहे...</span>
                    </>
                  ) : (
                    <>
                      <span>OTP मिळवा (Send OTP)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      ६-अंकी OTP प्रविष्ट करा
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-[#2864ED] hover:underline font-semibold"
                    >
                      नंबर बदला
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="******"
                    className="w-full h-[50px] px-4 text-center tracking-widest text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2864ED]/30 focus:border-[#2864ED] transition-all"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>SMS द्वारे आलेला OTP</span>
                    {resendCooldown > 0 ? (
                      <span className="text-gray-400">पुन्हा पाठवा ({resendCooldown}s)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#2864ED] font-bold hover:underline"
                      >
                        पुन्हा OTP पाठवा
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] bg-[#2864ED] hover:bg-[#1e54cc] active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-md shadow-[#2864ED]/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>सत्यापित होत आहे...</span>
                    </>
                  ) : (
                    <>
                      <span>🔐 OTP सत्यापित करा व लॉगिन करा</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('PASSWORD')}
                className="text-xs font-semibold text-gray-500 hover:text-[#2864ED] transition-colors"
              >
                ← पासवर्ड / PIN ने लॉगिन करा
              </button>
            </div>
          </div>
        )}

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
