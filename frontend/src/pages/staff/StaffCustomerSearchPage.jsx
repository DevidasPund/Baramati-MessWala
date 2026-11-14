import React, { useState } from 'react';
import { Search, User, Phone, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const StaffCustomerSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get('/customers', { params: { search: query.trim(), limit: 10 } });
      if (res?.data?.customers) {
        setResults(res.data.customers);
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Customer Directory Search</h2>
        <p className="text-xs text-slate-500">Quickly verify active meal plan, phone number, and status</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            required
            placeholder="Search by customer name, phone number, or BMW-2026-..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Searching directory...</div>
        ) : results.length > 0 ? (
          results.map((c) => {
            const activeSub = c.subscriptions?.[0];
            return (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{c.name}</div>
                      <div className="text-[11px] font-mono font-semibold text-emerald-700">{c.customerCode} • {c.phone}</div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : c.status === 'PAUSED'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  {activeSub ? (
                    <>
                      <div className="font-bold text-slate-800">Plan: {activeSub.plan.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        Valid till: <strong>{new Date(activeSub.endDate).toLocaleDateString()}</strong> | Included: {activeSub.plan.includedMeals.join(', ')}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 italic">No active subscription found. Cannot dine.</div>
                  )}
                </div>
              </div>
            );
          })
        ) : hasSearched ? (
          <div className="p-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No matching customers found for "{query}".
          </div>
        ) : null}
      </div>
    </div>
  );
};
