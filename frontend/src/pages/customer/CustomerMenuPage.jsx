import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  Calendar,
  Clock,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

export const CustomerMenuPage = () => {
  const [todayMenu, setTodayMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default rich Marathi weekly menu in case custom daily menu is not yet published by admin
  const defaultMenu = {
    day: new Intl.DateTimeFormat('mr-IN', { weekday: 'long' }).format(new Date()),
    date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    breakfast: {
      items: ['कांदे पोहे', 'गरमागरम चहा', 'मटकी उसळ'],
      timing: 'सकाळी ८:०० ते १०:००',
    },
    lunch: {
      items: ['गरमागरम चपाती (४ नग)', 'शेवभाजी / कोल्हापुरी रस्सा', 'मुगाची डाळ व जिरा राईस', 'काकडी कोशिंबीर व पापड'],
      timing: 'दुपारी १२:०० ते ३:००',
      special: 'घरगुती ताज्या मसाल्यात बनवलेली चवदार मेजवानी',
    },
    dinner: {
      items: ['फुलके / पोळी', 'पनीर भुर्जी / सुकी भाजी', 'वरण-भात व साजूक तूप', 'टोमॅटो सार'],
      timing: 'संध्याकाळी ७:३० ते १०:३०',
      special: 'पचायला हलके व पौष्टिक जेवण',
    },
    sundaySpecial: 'रविवार स्पेशल: पुरणपोळी, कटाची आमटी, बटाटा भाजी व बासमती भात',
  };

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const res = await api.get('/menu/today');
        if (res?.data?.menu) {
          setTodayMenu(res.data.menu);
        }
      } catch (err) {
        // Fallback to rich default menu
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            बारामती मेसवाला • अस्सल घरगुती चव
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            आजचा ताजा मेस मेनू
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 font-medium">
            {defaultMenu.day}, {defaultMenu.date} रोजीचे रुचकर व सात्त्विक जेवण
          </p>
        </div>
      </div>

      {/* Meal Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lunch Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-1.5 h-full bg-amber-500 absolute left-0 top-0" />
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">दुपारचे जेवण (Lunch)</h2>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>{defaultMenu.lunch.timing}</span>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-200/60">
              थाळी
            </span>
          </div>

          <div className="space-y-2.5 mb-4">
            {defaultMenu.lunch.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-[11px] text-amber-900 font-medium">
            💡 {defaultMenu.lunch.special}
          </div>
        </div>

        {/* Dinner Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-1.5 h-full bg-indigo-500 absolute left-0 top-0" />
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">रात्रीचे जेवण (Dinner)</h2>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span>{defaultMenu.dinner.timing}</span>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200/60">
              थाळी
            </span>
          </div>

          <div className="space-y-2.5 mb-4">
            {defaultMenu.dinner.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 font-medium">
            💡 {defaultMenu.dinner.special}
          </div>
        </div>

        {/* Breakfast Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="w-1.5 h-full bg-emerald-500 absolute left-0 top-0" />
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">सकाळचा नाश्ता (Breakfast)</h2>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{defaultMenu.breakfast.timing}</span>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200/60">
              नाश्ता
            </span>
          </div>

          <div className="space-y-2.5">
            {defaultMenu.breakfast.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sunday Special Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center gap-2.5 pb-4 border-b border-purple-200/60 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-purple-950">रविवार महा-विशेष मेजवानी</h2>
              <div className="text-[11px] text-purple-700 font-medium">
                दर रविवारी विशेष मिष्टान्न व गोड जेवण
              </div>
            </div>
          </div>

          <p className="text-xs font-bold text-purple-900 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-purple-200/50">
            {defaultMenu.sundaySpecial}
          </p>

          <p className="text-[11px] text-purple-700 mt-3">
            * रविवारचे जेवण दुपारी १२:०० ते ०३:३० पर्यंत उपलब्ध असते.
          </p>
        </div>
      </div>

      {/* Hygiene and Quality Assurance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">१००% शुद्ध, स्वच्छ व सात्त्विक आहार</div>
            <div className="text-[11px] text-slate-500">
              बारामती मेसवाला येथे दररोज उच्च दर्जाचे तेल, ताजी भाजी आणि आर.ओ. फिल्टर पाण्याचा वापर केला जातो.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
