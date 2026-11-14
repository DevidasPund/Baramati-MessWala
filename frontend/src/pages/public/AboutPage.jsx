import React from 'react';
import { Utensils, Award, ShieldCheck, Heart, Sparkles, Clock, Users, MapPin, ChefHat } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest bg-emerald-700/50 px-3.5 py-1 rounded-full">
            Our Story & Commitment
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">About Baramati Messwala</h1>
          <p className="text-emerald-100 max-w-2xl mx-auto text-base">
            Providing nutritious, hygienic, and authentic Maharashtrian meals to students and working professionals in Baramati.
          </p>
        </div>
      </section>

      {/* Main Story & Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              The Heart Behind Our Food
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Started With A Passion For Pure Home-Cooked Food
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Baramati Messwala was established to solve a critical issue faced by thousands of students moving to Baramati for higher education at Vidyanagari: access to healthy, clean, mother-like food at an affordable cost.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We believe that students perform their best in academics when their nutritional needs are taken care of. That is why we handpick our vegetables every single morning from local Baramati farmers, use pure groundnut oil, make stone-ground masala blends, and bake soft chapatis fresh on tawas as members walk in.
            </p>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Modern Digital Transformation</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Powered by <strong>MessMate</strong>, architected by <strong>Devidas Pund</strong>, Baramati Messwala became the first fully digitized mess in the region with automated QR attendance, transparent digital billing, and zero food wastage.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <ChefHat className="w-8 h-8 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-lg">Pure Veg Kitchen</h3>
              <p className="text-xs text-slate-500">100% vegetarian culinary tradition with daily changing varieties.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <ShieldCheck className="w-8 h-8 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-lg">5-Star Hygiene</h3>
              <p className="text-xs text-slate-500">Sanitized stainless steel utensils, hairnets, and purified water.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <Heart className="w-8 h-8 text-rose-500" />
              <h3 className="font-bold text-slate-900 text-lg">Student Friendly</h3>
              <p className="text-xs text-slate-500">Special consideration for exam schedules and flexible leave pause.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <Award className="w-8 h-8 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-lg">Sunday Feast</h3>
              <p className="text-xs text-slate-500">Special sweet feasts every Sunday including Gulab Jamun & Jalebi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Routine & Kitchen Schedule */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900">Our Daily Routine & Quality Standards</h2>
            <p className="text-sm text-slate-600 mt-1">Consistency and punctuality are at the core of our service.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>06:00 AM – Sourcing & Prep</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Fresh Procurement</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fresh leafy greens, tomatoes, and vegetables arrive directly from the morning market. Vegetables are washed thoroughly in saline water.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>11:30 AM – Lunch Cooking</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Slow-Cooked Flavors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dal tadka is tempered with pure ghee and cumin. Warm chapatis are pressed fresh as students arrive between 12:00 PM and 3:00 PM.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>07:00 PM – Comfort Dinner</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Light & Wholesome Night Meal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nutritious light curries like Sev Bhaji, Aloo Methi, or Sukhi Bhaji paired with hot phulkas and cooling buttermilk for a peaceful sleep.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
