import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Utensils,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { auth, isFirebaseClientConfigured } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedPlanId = searchParams.get('planId') || '';

  const [formData, setFormData] = useState({
    name: '',
    phone: searchParams.get('phone') || '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    emergencyContact: '',
    planId: preselectedPlanId,
  });

  // Phone OTP state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedCustomer, setSubmittedCustomer] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans');
        if (res?.data?.plans) {
          setPlans(res.data.plans);
          if (!preselectedPlanId && res.data.plans.length > 0) {
            setFormData((prev) => ({ ...prev, planId: res.data.plans[0].id }));
          }
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, [preselectedPlanId]);

  // Send OTP to customer phone
  const handleSendPhoneOtp = async () => {
    const clean = formData.phone.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      toast.error('कृपया योग्य १० अंकी मोबाइल नंबर टाका.');
      return;
    }

    const fullPhoneNumber = `+91${clean.slice(-10)}`;

    if (!isFirebaseClientConfigured || !auth) {
      toast('Firebase SMS OTP सेवा सक्रिय नसल्यामुळे थेट पासवर्डसह नोंदणी करा. मेस मालक पडताळणी करतील.', {
        icon: 'ℹ️',
        duration: 4000,
      });
      setPhoneVerified(false);
      return;
    }

    setLoading(true);

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-reg-container', {
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
      toast.success(`SMS OTP ${fullPhoneNumber} वर पाठवला.`);
    } catch (err) {
      console.error('Firebase Auth error:', err);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      if (err.code === 'auth/invalid-phone-number') {
        toast.error('अवैध मोबाइल नंबर.');
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('खूप जास्त प्रयत्न झाले. कृपया थोड्या वेळाने प्रयत्न करा.');
      } else {
        toast.error(err.message || 'SMS OTP पाठवण्यात त्रुटी आली.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyPhoneOtp = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      toast.error('कृपया वैध ६-अंकी OTP टाका.');
      return;
    }

    if (!confirmationResult) {
      toast.error('कृपया प्रथम OTP मागवा.');
      return;
    }

    setLoading(true);
    try {
      const userCred = await confirmationResult.confirm(cleanOtp);
      setFirebaseUid(userCred.user.uid);
      setPhoneVerified(true);
      toast.success('मोबाइल नंबर यशस्वीरीत्या प्रमाणित झाला! ✅');
    } catch (err) {
      console.error('OTP confirmation error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        toast.error('चुकीचा OTP कोड! कृपया एसएमएस मध्ये आलेला ६-अंकी OTP तपासून टाका.');
      } else if (err.code === 'auth/code-expired') {
        toast.error('हा OTP कालबाह्य झाला आहे. कृपया नवीन OTP मागवा.');
      } else {
        toast.error('चुकीचा OTP. कृपया योग्य OTP टाका.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('नाव आणि मोबाइल नंबर आवश्यक आहेत.');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('पासवर्ड जुळत नाहीत.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register-customer', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password || 'Customer@123',
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        planId: formData.planId || undefined,
        firebaseUid,
        phoneVerified,
      });

      if (res?.data?.customer || res?.data?.status === 'PENDING_APPROVAL') {
        setSubmittedCustomer(res.data.customer || { name: formData.name, phone: formData.phone });
        toast.success('नोंदणी यशस्वीरीत्या प्राप्त झाली!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'नोंदणी अयशस्वी.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-6 px-3 sm:px-6 font-sans">
      <div id="recaptcha-reg-container"></div>

      <div className="max-w-lg w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 space-y-5">
        {/* If submitted, show the pending approval confirmation */}
        {submittedCustomer ? (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <Clock className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              नोंदणी यशस्वी – मंजुरी प्रलंबित!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              आपली माहिती यशस्वीरीत्या नोंदवली गेली आहे. बारामती मेसवाला व्यवस्थापकाद्वारे आपले खाते पडताळून
              मंजूर (Approved) केल्यानंतरच आपले ग्राहक डॅशबोर्ड सुरू होईल.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
              <div>
                नाव: <span className="font-bold text-slate-900">{submittedCustomer.name}</span>
              </div>
              <div>
                मोबाइल: <span className="font-bold text-slate-900">{submittedCustomer.phone}</span>
              </div>
              <div>
                ग्राहक कोड:{' '}
                <span className="font-mono font-bold text-[#205D48]">
                  {submittedCustomer.customerCode || 'BMW-PENDING'}
                </span>
              </div>
              <div className="text-amber-700 font-bold">स्थिती: PENDING_APPROVAL (मंजुरीच्या प्रतीक्षेत)</div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full py-3 bg-[#205D48] hover:bg-[#184837] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md text-center"
              >
                लॉगिन पृष्ठावर जा
              </Link>
              <Link
                to="/"
                className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold text-center"
              >
                मुख्यपृष्ठावर परत जा
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#205D48] text-white flex items-center justify-center mx-auto shadow-sm">
                <Utensils className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                नवीन ग्राहक नोंदणी (Customer Registration)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                बारामती मेसवाला – घरगुती, शुद्ध व चविष्ट जेवणाची मेस
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">पूर्ण नाव *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="उदा. राहुल सचिन पाटील"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Mobile Number & Firebase OTP Verification */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">मोबाइल नंबर *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      disabled={phoneVerified}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })
                      }
                      placeholder="१० अंकी मोबाइल नंबर"
                      className="w-full pl-11 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 min-h-[44px]"
                    />
                  </div>

                  {!phoneVerified ? (
                    <button
                      type="button"
                      disabled={loading || formData.phone.length < 10}
                      onClick={handleSendPhoneOtp}
                      className="px-3 py-2 bg-[#205D48] text-white rounded-xl text-xs font-bold hover:bg-[#184837] shrink-0 disabled:opacity-50 min-h-[44px]"
                    >
                      {otpSent ? 'पुन्हा पाठवा' : 'OTP मिळवा'}
                    </button>
                  ) : (
                    <span className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>प्रमाणित</span>
                    </span>
                  )}
                </div>

                {/* OTP Input box if OTP is sent & not verified */}
                {otpSent && !phoneVerified && (
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="६-अंकी SMS OTP टाका"
                      className="flex-1 px-3 py-1.5 text-xs bg-amber-50 border border-amber-300 rounded-xl font-bold text-center"
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleVerifyPhoneOtp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      सत्यापित करा
                    </button>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">पत्ता / हॉस्टेल / रूम नंबर *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="उदा. रूम नं ४, विद्यानगरी, बारामती"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Optional Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ईमेल (पर्यायी)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="उदा. rahul@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Optional 4-digit PIN / Password */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">पिन / पासवर्ड *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="उदा. 1234"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">पिन पुष्टी करा *</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="पुन्हा टाका"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold min-h-[44px]"
                  />
                </div>
              </div>

              {/* Meal Plan Preference */}
              {plans.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">इच्छित मेस प्लॅन</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white min-h-[44px]"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.price}/महिना
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  नोंदणीनंतर मेस मालक आपले खाते तपासून मंजूर करतील. मंजुरीनंतर आपण डॅशबोर्डमध्ये लॉगिन करू शकाल.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#205D48] hover:bg-[#184837] active:scale-98 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>{loading ? 'नोंदणी होत आहे...' : 'नोंदणी अर्ज सादर करा'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 pt-2 border-t">
              आधीच नोंदणीकृत आहात?{' '}
              <Link to="/login" className="font-extrabold text-[#205D48] hover:underline">
                येथे लॉगिन करा
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
