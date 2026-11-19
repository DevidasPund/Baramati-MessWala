import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Utensils,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Clock,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedPlanId = searchParams.get('planId') || '';

  const [formData, setFormData] = useState({
    name: '',
    phone: searchParams.get('phone') || '',
    email: '',
    address: '',
    emergencyContact: '',
    planId: preselectedPlanId,
  });

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedCustomer, setSubmittedCustomer] = useState(null);

  const navigate = useNavigate();

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

  // Submit Registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.name.trim() || cleanPhone.length !== 10) {
      toast.error('कृपया आपले नाव आणि वैध १०-अंकी भारतीय मोबाइल नंबर प्रविष्ट करा.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register-customer', {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email ? formData.email.trim() : undefined,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        planId: formData.planId || undefined,
      });

      if (res?.data?.customer || res?.data?.status === 'PENDING_APPROVAL') {
        setSubmittedCustomer(res.data.customer || { name: formData.name, phone: cleanPhone });
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

            {/* Initial Password Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 max-w-sm mx-auto text-left flex items-start gap-2.5">
              <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-blue-950 mb-0.5">सुरुवातीचा पासवर्ड (Initial Password):</span>
                <p className="leading-relaxed">
                  तुमचा सुरुवातीचा पासवर्ड तुमचा १०-अंकी मोबाइल नंबर आहे. सुरक्षिततेसाठी पहिल्या लॉगिननंतर पासवर्ड बदला.
                </p>
              </div>
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
          /* REGISTRATION FORM */
          <>
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                नवीन ग्राहक नोंदणी
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                बारामती मेसवाला (MessMate) मेस व डबा सेवेसाठी नोंदणी करा
              </p>
            </div>

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

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">मोबाइल नंबर *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength="10"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    placeholder="१०-अंकी मोबाइल नंबर"
                    className="w-full pl-11 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 min-h-[44px]"
                  />
                </div>
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

              {/* Optional Emergency Contact */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">आणीबाणी संपर्क / पालकांचा फोन</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength="10"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    placeholder="पालक / रूममेटचा फोन"
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

              {/* Initial Password Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-blue-950 mb-0.5">सुरुवातीचा पासवर्ड (Initial Password):</span>
                  <p className="leading-relaxed">
                    तुमचा सुरुवातीचा पासवर्ड तुमचा १०-अंकी मोबाइल नंबर असेल. सुरक्षिततेसाठी पहिल्या लॉगिननंतर पासवर्ड बदला.
                  </p>
                </div>
              </div>

              {/* Meal Plan Preference */}
              {plans.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">पसंतीचा मेस प्लॅन</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30 min-h-[44px]"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameMarathi || p.name} – ₹{p.price} ({p.durationDays} दिवस)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#205D48] hover:bg-[#184837] active:scale-98 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'नोंदणी सादर करत आहे...' : 'नोंदणी करा (Register Now)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 pt-2">
              आधीच नोंदणी केली आहे?{' '}
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
