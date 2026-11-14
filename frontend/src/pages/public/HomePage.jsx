import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, CheckCircle2, QrCode, ShieldCheck, Sparkles, ArrowRight, Star, Clock, ChefHat, Calendar, Smartphone, PhoneCall } from 'lucide-react';
import api from '../../services/api';

export const HomePage = () => {
  const [todayMenu, setTodayMenu] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, plansRes] = await Promise.all([
          api.get('/menu/today'),
          api.get('/subscriptions/plans'),
        ]);
        if (menuRes?.data?.menus) setTodayMenu(menuRes.data.menus);
        if (plansRes?.data?.plans) setPlans(plansRes.data.plans.slice(0, 3));
      } catch (err) {
        console.error('Home page data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Baramati's Premier Smart Mess System</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Authentic Home Taste. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  Manage Your Mess, The Smart Way!
                </span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Welcome to <strong>Baramati Messwala</strong>, where wholesome Maharashtrian food meets seamless digital convenience. Enjoy daily hot meals, effortless QR attendance, transparent monthly billing, and instant WhatsApp updates.
              </p>
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/plans"
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Explore Meal Plans</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/menu"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>View Today's Menu</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-black text-slate-900">500+</div>
                  <div className="text-xs text-slate-500 font-medium">Daily Happy Members</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">100%</div>
                  <div className="text-xs text-slate-500 font-medium">Fresh Veg & Pure Spices</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">4.9 ★</div>
                  <div className="text-xs text-slate-500 font-medium">Student Ratings</div>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                      BMW
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Baramati Messwala</h4>
                      <p className="text-xs text-emerald-600 font-semibold">Today's Special Feast</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                    Open Now
                  </span>
                </div>

                {/* Featured Dishes List */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      🍲
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">Special Kolhapuri Paneer Thali</div>
                      <div className="text-xs text-slate-500 truncate">4 Soft Chapatis, Dal Tadka, Jeera Rice, Gulab Jamun</div>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      🥗
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">100% Fresh Daily Vegetables</div>
                      <div className="text-xs text-slate-500 truncate">Sourced every morning from Baramati APMC market</div>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5 text-teal-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">Instant Smart QR Attendance</div>
                      <div className="text-xs text-slate-500">Scan & Dine in 2 seconds — no manual registers!</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://wa.me/919209184035?text=Hello%20Baramati%20Messwala,%20I%20want%20to%20join"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Join on WhatsApp (+91 92091 84035)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Why Choose Baramati Messwala
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Everything You Need For A Healthy & Hassle-Free Routine
          </h2>
          <p className="text-slate-600 text-base">
            Designed specifically for VP College, Agriculture College, and Vidyanagari students as well as local professionals in Baramati.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Pure Home Taste</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cooked with love using traditional Maharashtrian recipes, pure cooking oils, and zero artificial preservatives.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Hygiene & RO Water</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Daily sanitized dining halls, stainless steel cutlery, hairnets for kitchen staff, and RO purified drinking water.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Smart QR Attendance</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No paper registers. Scan your QR code right from your smartphone or let the counter staff scan it in 1 second.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Meal Skip & Pause</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Going home for holidays? Request a subscription pause or meal skip from your dashboard and save your meal credits.
            </p>
          </div>
        </div>
      </section>

      {/* Today's Food Menu Section (Live Data from DB) */}
      <section className="bg-slate-100/60 py-20 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Fresh Kitchen Schedule</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Today's Delicious Menu</h2>
              <p className="text-sm text-slate-600 mt-1">Prepared fresh three times daily at Baramati Messwala.</p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
            >
              <span>View Full Weekly Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {todayMenu.length > 0 ? (
              todayMenu.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        m.mealType === 'BREAKFAST' ? 'bg-orange-100 text-orange-700' :
                        m.mealType === 'LUNCH' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {m.mealType}
                      </span>
                      {m.isSpecial && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Special Feast
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{m.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">{m.description}</p>
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {Array.isArray(m.items) ? m.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </div>
                      )) : (
                        <div className="text-xs text-slate-700">{m.items}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {m.mealType === 'BREAKFAST' ? '07:30 - 10:00' : m.mealType === 'LUNCH' ? '12:00 - 15:00' : '19:30 - 22:30'}
                    </span>
                    <span className="font-semibold text-emerald-600">Freshly Cooked</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <Utensils className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Today's menu is being prepared by our head chef!</p>
                <Link to="/menu" className="mt-3 inline-block text-xs font-bold text-emerald-600 hover:underline">
                  Check weekly menu schedule →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Subscription Plans Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Affordable Memberships
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Transparent Mess Plans For Every Budget
          </h2>
          <p className="text-slate-600 text-base">
            No hidden charges. Enjoy unlimited chapatis, special Sunday feasts, and easy digital payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p, index) => (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-8 border flex flex-col justify-between transition-all ${
                index === 0
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20 relative'
                  : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {index === 0 && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-2 mb-6 min-h-[32px]">{p.description}</p>
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-100">
                  <span className="text-4xl font-extrabold text-slate-900">₹{Number(p.price).toFixed(0)}</span>
                  <span className="text-sm font-semibold text-slate-500">/ {p.durationDays} days</span>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Included In This Plan:</div>
                  {p.includedMeals.map((meal) => (
                    <div key={meal} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium">Daily {meal.charAt(0) + meal.slice(1).toLowerCase()}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">Digital QR Code & Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">Weekly Sunday Sweet Feast</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  to="/register"
                  className={`w-full py-3.5 text-center text-sm font-bold rounded-xl block transition-all ${
                    index === 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Subscribe Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Loved by Students</span>
            <h2 className="text-3xl font-bold tracking-tight">What Our Regular Members Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 p-7 rounded-2xl border border-slate-700 space-y-4">
              <div className="flex text-amber-400">
                {'★'.repeat(5)}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "Staying away from home in Baramati, good food was my biggest worry. Baramati Messwala's chapati is so soft and dal tastes just like my mother's cooking. The QR scanner attendance is super fast!"
              </p>
              <div>
                <h4 className="text-sm font-bold text-white">Amit Patil</h4>
                <p className="text-xs text-slate-400">VP College of Engineering</p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-7 rounded-2xl border border-slate-700 space-y-4">
              <div className="flex text-amber-400">
                {'★'.repeat(5)}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "The MessMate web app is amazing. I can check today's menu from my phone before leaving hostel, track my bills, and pause my meals when I go home for weekends without paying extra."
              </p>
              <div>
                <h4 className="text-sm font-bold text-white">Rohit Deshmukh</h4>
                <p className="text-xs text-slate-400">Agricultural College Student</p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-7 rounded-2xl border border-slate-700 space-y-4">
              <div className="flex text-amber-400">
                {'★'.repeat(5)}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "Cleanliness and hygiene here are unmatched. RO purified water, clean stainless steel plates, and courteous staff. Best mess in Vidyanagari area hands down!"
              </p>
              <div>
                <h4 className="text-sm font-bold text-white">Priya Kulkarni</h4>
                <p className="text-xs text-slate-400">Hostel Student, Baramati</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Contact Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready to Taste Delicious Home Food?</h3>
            <p className="text-emerald-100 max-w-xl text-sm leading-relaxed">
              Visit our mess today at Shriram Chowk, Pipeline Road, Ahilyanagar or connect directly on WhatsApp to start your 7-day trial or monthly subscription.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="https://wa.me/919209184035?text=Hello%20Baramati%20Messwala,%20I%20want%20to%20register"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 bg-white text-emerald-800 font-bold rounded-xl shadow hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp: +91 92091 84035</span>
            </a>
            <Link
              to="/register"
              className="px-6 py-3.5 bg-emerald-900/60 hover:bg-emerald-900 text-white font-bold rounded-xl border border-emerald-400/30 transition-colors flex items-center justify-center text-sm"
            >
              Online Registration
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
