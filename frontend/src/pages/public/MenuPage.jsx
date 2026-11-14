import React, { useState, useEffect } from 'react';
import { Utensils, Clock, CheckCircle2, Star, Calendar, Sparkles } from 'lucide-react';
import api from '../../services/api';

export const MenuPage = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [todayMenu, setTodayMenu] = useState([]);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const [todayRes, weeklyRes] = await Promise.all([
          api.get('/menu/today'),
          api.get('/menu/weekly'),
        ]);
        if (todayRes?.data?.menus) setTodayMenu(todayRes.data.menus);
        if (weeklyRes?.data?.menus) setWeeklyMenu(weeklyRes.data.menus);
      } catch (err) {
        console.error('Menu load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const filteredToday = todayMenu.filter((m) => activeTab === 'ALL' || m.mealType === activeTab);

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest bg-emerald-700/50 px-3.5 py-1 rounded-full">
            Wholesome Maharashtrian Cooking
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Daily & Weekly Food Menu</h1>
          <p className="text-emerald-100 max-w-xl mx-auto text-sm sm:text-base">
            Check today's freshly prepared meal items and plan your dining schedule at Baramati Messwala.
          </p>
        </div>
      </section>

      {/* Today's Live Menu */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Served Fresh Today</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Today's Meal Spread</h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl">
            {['ALL', 'BREAKFAST', 'LUNCH', 'DINNER'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Meals' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading today's fresh menu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {filteredToday.length > 0 ? (
              filteredToday.map((m) => (
                <div key={m.id} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        m.mealType === 'BREAKFAST' ? 'bg-orange-100 text-orange-700' :
                        m.mealType === 'LUNCH' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {m.mealType}
                      </span>
                      {m.isSpecial && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          Feast
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{m.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">{m.description}</p>

                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dishes Included:</div>
                      {Array.isArray(m.items) ? m.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </div>
                      )) : (
                        <div className="text-xs text-slate-700">{m.items}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {m.mealType === 'BREAKFAST' ? '07:30 – 10:00 AM' : m.mealType === 'LUNCH' ? '12:00 – 03:00 PM' : '07:30 – 10:30 PM'}
                    </span>
                    <span className="font-bold text-emerald-600">Freshly Cooked</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <Utensils className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No menu items published for this filter today.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Weekly Menu Schedule Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Standard Weekly Menu Rotation</h2>
              <p className="text-xs text-slate-500">Our carefully balanced weekly menu ensures nutrition, variety, and taste.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Breakfast (07:30 - 10:00)</th>
                  <th className="py-3 px-4">Lunch (12:00 - 15:00)</th>
                  <th className="py-3 px-4">Dinner (19:30 - 22:30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/50">Monday</td>
                  <td className="py-3 px-4">Kanda Poha / Masala Chai</td>
                  <td className="py-3 px-4">Chole Masala, Aloo Gobi, Chapati, Dal Tadka, Steamed Rice</td>
                  <td className="py-3 px-4">Sev Bhaji, Methi Sukhi, Phulke, Dal Fry, Jeera Rice</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/50">Tuesday</td>
                  <td className="py-3 px-4">Upma with Coconut Chutney</td>
                  <td className="py-3 px-4">Paneer Butter Masala, Bhendi Fry, Chapati, Moong Dal, Rice</td>
                  <td className="py-3 px-4">Kadhi Pakoda, Batata Sukhi Bhaji, Chapati, Khichdi</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/50">Wednesday</td>
                  <td className="py-3 px-4">Misal Pav with Tarri & Farsan</td>
                  <td className="py-3 px-4">Mix Veg Kolhapuri, Dal Makhani, Chapati / Bhakri, Jeera Rice</td>
                  <td className="py-3 px-4">Baingan Bharta, Tawa Roti, Varan Bhat, Roasted Papad</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/50">Thursday</td>
                  <td className="py-3 px-4">Sabudana Khichdi / Curd</td>
                  <td className="py-3 px-4">Rajma Masala, Lauki Kofta, Chapati, Dal Fry, Rice</td>
                  <td className="py-3 px-4">Matki Usal, Chapati, Dal Fry, Steamed Rice, Buttermilk</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/50">Friday</td>
                  <td className="py-3 px-4">Batata Poha / Hot Tea</td>
                  <td className="py-3 px-4">Shahi Paneer, Cabbage Peas, Chapati, Dal Tadka, Rice</td>
                  <td className="py-3 px-4">Shevga Bhaji (Drumstick curry), Phulke, Dal, Rice</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-700 bg-emerald-50/50">Saturday</td>
                  <td className="py-3 px-4">Idli Sambar / Coconut Chutney</td>
                  <td className="py-3 px-4">Chana Masala, Aloo Palak, Chapati, Dal Fry, Rice</td>
                  <td className="py-3 px-4">Pav Bhaji & Masala Rice / Light Dinner Thali</td>
                </tr>
                <tr className="bg-amber-50/60 font-semibold">
                  <td className="py-3 px-4 font-bold text-amber-800">Sunday</td>
                  <td className="py-3 px-4">Masala Dosa / Chai</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">★ Special Feast: Paneer Tikka Masala, Veg Biryani, Gulab Jamun / Jalebi</td>
                  <td className="py-3 px-4">Light Comfort Khichdi, Kadhi, Papad, Pickle</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
