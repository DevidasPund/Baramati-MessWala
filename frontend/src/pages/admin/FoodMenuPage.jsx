import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Calendar,
  Star,
  CheckCircle2,
  Trash2,
  Share2,
  Clock,
  Send,
  Coffee,
  Utensils,
  Moon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const FoodMenuPage = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuForm, setMenuForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    title: '',
    items: '',
    description: '',
    isSpecial: false,
    specialNote: '',
    isPublished: true,
  });

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/menu', {
        params: { date: selectedDate },
      });
      if (res?.data?.menus) {
        setMenus(res.data.menus);
      }
    } catch (err) {
      toast.error('मेनू माहिती लोड करण्यात अडचण आली');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [selectedDate]);

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuForm.title || !menuForm.items) {
      toast.error('कृपया मेनूचे शीर्षक आणि पदार्थांची नावे भरा');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/menu', menuForm);
      toast.success(res.message || 'मेनू यशस्वीरित्या जतन केला!');
      setModalOpen(false);
      setMenuForm({
        date: selectedDate,
        mealType: 'LUNCH',
        title: '',
        items: '',
        description: '',
        isSpecial: false,
        specialNote: '',
        isPublished: true,
      });
      fetchMenus();
    } catch (err) {
      toast.error(err.message || 'मेनू सेव्ह करता आला नाही');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm('हा मेनू हटवायचा आहे का?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('मेनू यशस्वीरित्या हटवण्यात आला');
      fetchMenus();
    } catch (err) {
      toast.error('मेनू हटवता आला नाही');
    }
  };

  const handleBroadcast = async (id) => {
    try {
      const res = await api.post(`/menu/${id}/broadcast`);
      toast.success(res.message || 'सर्व सक्रिय ग्राहकांना WhatsApp ब्रॉडकास्ट पाठवला!');
    } catch (err) {
      toast.error('ब्रॉडकास्ट पाठवता आला नाही');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-blue-600" />
            <span>दैनिक मेनू व्यवस्थापन (Food Menu)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • सकाळचा नाश्ता, दुपारचे व रात्रीचे जेवण नियोजन आणि WhatsApp ब्रॉडकास्ट
          </p>
        </div>

        <button
          onClick={() => {
            setMenuForm((prev) => ({ ...prev, date: selectedDate }));
            setModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन मेनू जोडा</span>
        </button>
      </div>

      {/* Date Selector Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">मेनू तारीख:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors"
          >
            आजचा मेनू
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            उद्याचा मेनू
          </button>
        </div>
      </div>

      {/* Menus Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500 font-medium">मेनू लोड होत आहे...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'BREAKFAST', label: 'नाश्ता', timing: 'सकाळी ८:०० ते १०:००', icon: Coffee },
            { id: 'LUNCH', label: 'दुपारचे जेवण', timing: 'दुपारी १२:०० ते ३:००', icon: Utensils },
            { id: 'DINNER', label: 'रात्रीचे जेवण', timing: 'संध्याकाळी ७:३० ते १०:३०', icon: Moon },
          ].map((meal) => {
            const menu = menus.find((m) => m.mealType === meal.id);
            const Icon = meal.icon;
            return (
              <div
                key={meal.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        meal.id === 'BREAKFAST'
                          ? 'bg-orange-50 text-orange-700'
                          : meal.id === 'LUNCH'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {meal.label}
                    </span>

                    {menu?.isSpecial && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md flex items-center gap-1 border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        विशेष मेजवानी
                      </span>
                    )}
                  </div>

                  {menu ? (
                    <div className="space-y-3">
                      <h3 className="text-base font-bold text-slate-900">{menu.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">{menu.description || 'घरगुती सात्त्विक अन्न'}</p>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          समाविष्ट पदार्थ:
                        </span>
                        {Array.isArray(menu.items) ? (
                          menu.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-700 font-semibold">{menu.items}</div>
                        )}
                      </div>

                      {menu.specialNote && (
                        <div className="text-[11px] font-bold text-amber-800 bg-amber-50 p-2 rounded-xl">
                          ★ {menu.specialNote}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-medium">या तारखेला {meal.label} मेनू जोडलेला नाही.</p>
                      <button
                        onClick={() => {
                          setMenuForm({
                            date: selectedDate,
                            mealType: meal.id,
                            title: '',
                            items: '',
                            description: '',
                            isSpecial: false,
                            specialNote: '',
                            isPublished: true,
                          });
                          setModalOpen(true);
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        + {meal.label} मेनू तयार करा
                      </button>
                    </div>
                  )}
                </div>

                {menu && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleBroadcast(menu.id)}
                      className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      title="सर्व सक्रिय सदस्यांना WhatsApp वर पाठवा"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp ब्रॉडकास्ट</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Menu Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">मेनू तयार करा / शेड्यूल करा</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">तारीख</label>
                  <input
                    type="date"
                    required
                    value={menuForm.date}
                    onChange={(e) => setMenuForm({ ...menuForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">जेवणाची वेळ</label>
                  <select
                    value={menuForm.mealType}
                    onChange={(e) => setMenuForm({ ...menuForm, mealType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="BREAKFAST">सकाळचा नाश्ता</option>
                    <option value="LUNCH">दुपारचे जेवण</option>
                    <option value="DINNER">रात्रीचे जेवण</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">मेनू नाव / शीर्षक *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. खान्देशी शेवभाजी व बासमती भात किंवा रविवार स्पेशल"
                  value={menuForm.title}
                  onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  समाविष्ट पदार्थ (स्वल्पविराम देऊन लिहा) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="उदा. चपाती (४ नग), शेवभाजी, मुगाची डाळ, जिरा राईस, कोशिंबीर, पापड"
                  value={menuForm.items}
                  onChange={(e) => setMenuForm({ ...menuForm, items: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">वर्णन (ऐच्छिक)</label>
                <input
                  type="text"
                  placeholder="उदा. अस्सल घरगुती मसाल्यात बनवलेले रुचकर जेवण"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="specialFeast"
                  checked={menuForm.isSpecial}
                  onChange={(e) => setMenuForm({ ...menuForm, isSpecial: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="specialFeast" className="font-bold text-slate-700">
                  विशेष मेजवानी म्हणून चिन्हांकित करा (Special Feast)
                </label>
              </div>

              {menuForm.isSpecial && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">विशेष नोंद</label>
                  <input
                    type="text"
                    placeholder="उदा. अमर्यादित गुलाबजाम व बासुंदी समाविष्ट"
                    value={menuForm.specialNote}
                    onChange={(e) => setMenuForm({ ...menuForm, specialNote: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'जतन होत आहे...' : 'मेनू प्रसिद्ध करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
