import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight, HelpCircle, PhoneCall } from 'lucide-react';
import api from '../../services/api';

export const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans');
        if (res?.data?.plans) setPlans(res.data.plans);
      } catch (err) {
        console.error('Plans error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest bg-emerald-700/50 px-3.5 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Mess Subscription Plans</h1>
          <p className="text-emerald-100 max-w-xl mx-auto text-sm sm:text-base">
            Affordable monthly and weekly packages with zero hidden charges. Unlimited chapatis and weekly sweet feasts included.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((p, idx) => {
              const isPopular = p.code.includes('FULL') || idx === 0;
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl p-8 border flex flex-col justify-between transition-all ${
                    isPopular
                      ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20 relative'
                      : 'border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full">
                      Recommended
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        {p.planType} Plan
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{p.durationDays} Days</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mt-2">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">{p.description}</p>

                    <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-100">
                      <span className="text-4xl font-extrabold text-slate-900">₹{Number(p.price).toFixed(0)}</span>
                      <span className="text-sm font-semibold text-slate-500">/ {p.durationDays} days</span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Meals:</div>
                      {p.includedMeals.map((meal) => (
                        <div key={meal} className="flex items-center gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-800">Daily {meal.charAt(0) + meal.slice(1).toLowerCase()}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Unlimited Hot Chapatis & Dal</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Personal Dynamic QR Code</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Sunday Special Sweet Feast</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Leave / Exam Pause Support</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                    <Link
                      to={`/register?planId=${p.id}`}
                      className={`w-full py-3.5 text-center text-sm font-bold rounded-xl transition-all ${
                        isPopular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      Subscribe & Join
                    </Link>
                    <a
                      href={`https://wa.me/919822334455?text=Hi%20Baramati%20Messwala,%20I%20want%20to%20know%20more%20about%20the%20${encodeURIComponent(p.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 text-center text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 flex items-center justify-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>WhatsApp Enquiry</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/70 rounded-3xl p-8 border border-slate-200 space-y-6">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>Frequently Asked Questions</span>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">Can I pause my subscription when going home for holidays?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Yes! Through your MessMate customer dashboard, you can request a subscription pause. The paused days are added to your plan expiry so you never lose your hard-earned money.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">Can I bring a guest or friend for a meal?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Absolutely. You can book an extra guest meal directly through your customer dashboard at a nominal price (₹110), which gets added to your monthly bill or paid on spot.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">What payment methods are supported?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                We support all UPI payment apps (PhonePe, Google Pay, Paytm, BHIM) via our official dynamic QR code, as well as cash payments at our counter in Vidyanagari.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
