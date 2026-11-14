import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Utensils,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const CustomerSubscriptionPage = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const customer = user?.customer;

  useEffect(() => {
    const fetchSubData = async () => {
      setLoading(true);
      try {
        const [dashRes, plansRes] = await Promise.allSettled([
          api.get('/customers/me/dashboard'),
          api.get('/subscriptions/plans'),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
          setSubscription(dashRes.value.data.customer?.subscription || null);
        }
        if (plansRes.status === 'fulfilled' && plansRes.value?.data?.plans) {
          setPlans(plansRes.value.data.plans);
        }
      } catch (err) {
        console.error('Failed to load subscription info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubData();
  }, []);

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = subscription ? calculateDaysLeft(subscription.endDate) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span>माझे मेस सबस्क्रिप्शन</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            आपल्या चालू मेस योजनेचा तपशील, समाप्ती तारीख आणि नूतनीकरण
          </p>
        </div>

        <Link
          to="/customer/bills"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>योजना नूतनीकरण / पेमेंट</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">सबस्क्रिप्शन तपशील लोड होत आहे...</p>
        </div>
      ) : subscription ? (
        <div className="space-y-6">
          {/* Active Plan Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold tracking-wide uppercase mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  सक्रिय सबस्क्रिप्शन
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {subscription?.plan?.name || 'मासिक संपूर्ण मेस योजना'}
                </h2>
                <p className="text-xs text-blue-200 mt-1">
                  बारामती मेसवाला • ग्राहक कोड: <span className="font-mono font-bold text-white">{customer?.customerCode}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-blue-200 font-medium">मासिक शुल्क</div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  ₹{Number(subscription?.plan?.price || 3000).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Dates & Validity Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 relative z-10 text-xs">
              <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <div className="text-blue-200 text-[11px] flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  सुरुवात तारीख
                </div>
                <div className="font-bold text-white">
                  {subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString('mr-IN') : 'सक्रिय'}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <div className="text-blue-200 text-[11px] flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  समाप्ती तारीख
                </div>
                <div className="font-bold text-white">
                  {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString('mr-IN') : 'लागू नाही'}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <div className="text-blue-200 text-[11px] flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  शिल्लक दिवस
                </div>
                <div className="font-bold text-emerald-300 text-sm">
                  {daysLeft} दिवस शिल्लक
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <div className="text-blue-200 text-[11px] flex items-center gap-1 mb-1">
                  <Utensils className="w-3.5 h-3.5 text-purple-300" />
                  जेवणाचा प्रकार
                </div>
                <div className="font-bold text-white">
                  दुपार + रात्र
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice if Expiring Soon */}
          {daysLeft <= 5 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-900">आपले सबस्क्रिप्शन लवकरच संपणार आहे!</div>
                <p className="text-amber-700 mt-0.5">
                  अखंड मेस सेवेसाठी कृपया पुढील महिन्याचे शुल्क PhonePe / UPI द्वारे जमा करून नूतनीकरण करा.
                </p>
                <Link
                  to="/customer/bills"
                  className="inline-flex items-center gap-1 mt-2 text-indigo-700 font-bold hover:underline"
                >
                  <span>आताच बिल भरा</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Timings & Rules Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>मेस जेवणाच्या वेळा</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">सकाळचा नाश्ता:</span>
                  <span className="font-semibold text-slate-600">सकाळी ८:०० ते १०:००</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">दुपारचे जेवण:</span>
                  <span className="font-semibold text-slate-600">दुपारी १२:०० ते ०३:००</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">रात्रीचे जेवण:</span>
                  <span className="font-semibold text-slate-600">संध्याकाळी ०७:३० ते १०:३०</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>नियम व सुट्टी धोरण</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p>• जेवणापूर्वी स्वतःचा वैयक्तिक QR कोड काऊंटरवर स्कॅन करणे अनिवार्य आहे.</p>
                <p>• गावी जाताना किंवा जेवण बंद ठेवायचे असल्यास किमान २४ तास आधी 'अतिरिक्त जेवण / रजा' टॅबमधून विनंती पाठवावी.</p>
                <p>• महिन्यात जास्तीत जास्त ४ सुट्ट्या सबस्क्रिप्शनमध्ये पुढे वाढवून दिल्या जातात.</p>
                <p>• इतर कोणत्याही मदतीसाठी संपर्क साधा: <span className="font-bold text-slate-900">९२०९१ ८४०३५</span>.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">कोणतेही सक्रिय सबस्क्रिप्शन आढळले नाही</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            आपल्या खात्यावर सध्या चालू मेस योजना सुरू नाही. बारामती मेसवालाच्या स्वादिष्ट घरगुती भोजनाचा लाभ घेण्यासाठी नवीन योजना निवडा.
          </p>
          <Link
            to="/customer/bills"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <span>नवीन योजना सक्रिय करा</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
