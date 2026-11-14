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
      toast.error('Failed to load menu');
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
      toast.error('Please enter a title and dish items');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/menu', menuForm);
      toast.success(res.message || 'Menu saved successfully');
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
      toast.error(err.message || 'Failed to save menu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm('Delete this food menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Menu item deleted');
      fetchMenus();
    } catch (err) {
      toast.error('Failed to delete menu');
    }
  };

  const handleBroadcast = async (id) => {
    try {
      const res = await api.post(`/menu/${id}/broadcast`);
      toast.success(res.message || 'Broadcast sent to active members');
    } catch (err) {
      toast.error('Broadcast failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Food Menu Management</h2>
          <p className="text-xs text-slate-500">
            Schedule daily breakfast, lunch, and dinner menus with WhatsApp broadcast
          </p>
        </div>

        <button
          onClick={() => {
            setMenuForm((prev) => ({ ...prev, date: selectedDate }));
            setModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add / Schedule Menu</span>
        </button>
      </div>

      {/* Date Selector Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Menu Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors"
          >
            Today's Menu
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            Tomorrow's Menu
          </button>
        </div>
      </div>

      {/* Menus Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500">Loading food menus...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['BREAKFAST', 'LUNCH', 'DINNER'].map((meal) => {
            const menu = menus.find((m) => m.mealType === meal);
            return (
              <div
                key={meal}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        meal === 'BREAKFAST'
                          ? 'bg-orange-50 text-orange-700'
                          : meal === 'LUNCH'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {meal}
                    </span>

                    {menu?.isSpecial && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md flex items-center gap-1 border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Special
                      </span>
                    )}
                  </div>

                  {menu ? (
                    <div className="space-y-3">
                      <h3 className="text-base font-bold text-slate-900">{menu.title}</h3>
                      <p className="text-xs text-slate-500">{menu.description || 'Prepared fresh daily.'}</p>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Dishes:
                        </span>
                        {Array.isArray(menu.items) ? (
                          menu.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-700">{menu.items}</div>
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
                      <p className="text-xs">No menu scheduled for {meal} on this date.</p>
                      <button
                        onClick={() => {
                          setMenuForm({
                            date: selectedDate,
                            mealType: meal,
                            title: '',
                            items: '',
                            description: '',
                            isSpecial: false,
                            specialNote: '',
                            isPublished: true,
                          });
                          setModalOpen(true);
                        }}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        + Create {meal} Menu
                      </button>
                    </div>
                  )}
                </div>

                {menu && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleBroadcast(menu.id)}
                      className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Send WhatsApp update to all active members"
                    >
                      <Send className="w-3 h-3" />
                      <span>Broadcast WhatsApp</span>
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
              <h3 className="text-base font-bold text-slate-900">Schedule Food Menu</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Meal Date</label>
                  <input
                    type="date"
                    required
                    value={menuForm.date}
                    onChange={(e) => setMenuForm({ ...menuForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Meal Category</label>
                  <select
                    value={menuForm.mealType}
                    onChange={(e) => setMenuForm({ ...menuForm, mealType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Menu Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Maharashtrian Thali / Khandeshi Sev Bhaji"
                  value={menuForm.title}
                  onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dishes Included (Comma separated) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Paneer Kolhapuri, Bhendi Fry, Chapati (4 pcs), Dal Tadka, Steamed Rice, Gulab Jamun"
                  value={menuForm.items}
                  onChange={(e) => setMenuForm({ ...menuForm, items: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pure cow ghee preparation, farm fresh veggies"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="specialFeast"
                  checked={menuForm.isSpecial}
                  onChange={(e) => setMenuForm({ ...menuForm, isSpecial: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="specialFeast" className="font-bold text-slate-700">
                  Mark as Special Feast (Highlight with Star)
                </label>
              </div>

              {menuForm.isSpecial && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Special Feast Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Includes Unlimited Gulab Jamun & Basundi"
                    value={menuForm.specialNote}
                    onChange={(e) => setMenuForm({ ...menuForm, specialNote: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save & Publish Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
