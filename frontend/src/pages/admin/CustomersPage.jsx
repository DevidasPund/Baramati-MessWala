import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  Phone,
  QrCode,
  CheckCircle2,
  XCircle,
  PauseCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Add Customer Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    planId: '',
    initialPaymentMethod: 'UPI',
    status: 'ACTIVE',
  });

  // Delete Confirmation State
  const [deleteModalCustomer, setDeleteModalCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search, status: statusFilter, page, limit: 10 },
      });
      if (res?.data) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('ग्राहक माहिती लोड करण्यात अडचण आली');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, page]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans');
        if (res?.data?.plans) {
          setPlans(res.data.plans);
          if (res.data.plans.length > 0) {
            setNewCustomer((prev) => ({ ...prev, planId: res.data.plans[0].id }));
          }
        }
      } catch (err) {}
    };
    fetchPlans();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('ग्राहकाचे नाव आणि मोबाईल क्रमांक आवश्यक आहे');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/customers', newCustomer);
      toast.success(res.message || 'नवीन ग्राहक यशस्वीरित्या नोंदवला गेला!');
      setAddModalOpen(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        emergencyContact: '',
        planId: plans[0]?.id || '',
        initialPaymentMethod: 'UPI',
        status: 'ACTIVE',
      });
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'ग्राहक नोंदणी अयशस्वी');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteModalCustomer) return;
    try {
      await api.delete(`/customers/${deleteModalCustomer.id}`);
      toast.success('ग्राहक यशस्वीरित्या हटवण्यात आला');
      setDeleteModalCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'ग्राहक हटवता आला नाही');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>ग्राहक व्यवस्थापन (Customers)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            बारामती मेसवाला • एकूण {pagination.total} नोंदणीकृत मेस सभासद
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन ग्राहक जोडा</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="नाव, मोबाईल किंवा कोडने शोधा..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">सर्व ग्राहक (All)</option>
            <option value="ACTIVE">सक्रिय सभासद (Active)</option>
            <option value="PAUSED">स्थगित / रजेवर (Paused)</option>
            <option value="INACTIVE">निष्क्रिय (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-medium">ग्राहक माहिती लोड होत आहे...</div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">ग्राहक कोड</th>
                  <th className="py-3 px-5">नाव आणि संपर्क</th>
                  <th className="py-3 px-5">चालू सबस्क्रिप्शन</th>
                  <th className="py-3 px-5">स्थिती</th>
                  <th className="py-3 px-5">नोंदणी तारीख</th>
                  <th className="py-3 px-5 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((c) => {
                  const activeSub = c.subscriptions?.[0];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold font-mono text-blue-700">
                        {c.customerCode}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.phone}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        {activeSub ? (
                          <div>
                            <span className="font-semibold text-slate-800">{activeSub.plan.name}</span>
                            <div className="text-[10px] text-slate-400">
                              वैधता: {new Date(activeSub.endDate).toLocaleDateString('mr-IN')} पर्यंत
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">कोणतीही चालू योजना नाही</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : c.status === 'PAUSED'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {c.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {c.status === 'PAUSED' && <PauseCircle className="w-3 h-3 text-amber-600" />}
                          {c.status === 'INACTIVE' && <XCircle className="w-3 h-3 text-rose-600" />}
                          {c.status === 'ACTIVE' ? 'सक्रिय' : c.status === 'PAUSED' ? 'स्थगित' : 'निष्क्रिय'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {new Date(c.joiningDate).toLocaleDateString('mr-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/customers/${c.id}`}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="संपूर्ण प्रोफाइल आणि QR कोड पहा"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModalCustomer(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ग्राहक हटवा"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">शोध निकषानुसार कोणताही ग्राहक आढळला नाही.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              पान {page} / {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                मागे
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                पुढे
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">नवीन मेस ग्राहक नोंदणी</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">ग्राहकाचे नाव *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. स्वप्नील पाटील"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">मोबाईल क्रमांक *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9822334455"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">ईमेल पत्ता</label>
                  <input
                    type="email"
                    placeholder="swapnil@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">मेस सबस्क्रिप्शन योजना</label>
                <select
                  value={newCustomer.planId}
                  onChange={(e) => setNewCustomer({ ...newCustomer, planId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="">कोणतीही योजना नाही (केवळ नोंदणी)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{Number(p.price).toFixed(0)} ({p.durationDays} दिवस)
                    </option>
                  ))}
                </select>
              </div>

              {newCustomer.planId && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">प्रारंभिक देयक पद्धत</label>
                  <select
                    value={newCustomer.initialPaymentMethod}
                    onChange={(e) => setNewCustomer({ ...newCustomer, initialPaymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="UPI">UPI द्वारे प्राप्त (Auto-verified)</option>
                    <option value="CASH">रोख रक्कम प्राप्त (Cash)</option>
                    <option value="">बाकी / नंतर देणार (Unpaid)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">स्थानिक पत्ता / रूम / वसतिगृह</label>
                <input
                  type="text"
                  placeholder="उदा. व्ही.पी. कॉलेज हॉस्टेल, रूम १०२"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">आणीबाणी संपर्क / पालकांचा फोन</label>
                <input
                  type="text"
                  placeholder="उदा. ९८२२००११२२ (वडील)"
                  value={newCustomer.emergencyContact}
                  onChange={(e) => setNewCustomer({ ...newCustomer, emergencyContact: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'नोंद होत आहे...' : 'ग्राहक जतन करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base">ग्राहक हटवायचा आहे का?</h4>
              <p className="text-xs text-slate-500">
                तुम्हाला खात्री आहे का की <strong>{deleteModalCustomer.name}</strong> ({deleteModalCustomer.customerCode}) कायमचा हटवायचा आहे?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                रद्द करा
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                होय, हटवा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
