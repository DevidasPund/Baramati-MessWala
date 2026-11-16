import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  Lock,
  UserCheck,
  RefreshCw,
  Clock,
  KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CustomerVerificationPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: null, reason: '' });
  const [passwordModal, setPasswordModal] = useState({ open: false, newPassword: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers?limit=100');
      if (res?.data?.customers) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      toast.error('ग्राहक माहिती लोड करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleStatusChange = async (customerId, targetStatus, reason = '') => {
    setActionLoading(true);
    try {
      await api.put(`/customers/${customerId}/verify-status`, {
        status: targetStatus,
        reason,
      });
      toast.success(`ग्राहक स्थिती यशस्वीरीत्या '${targetStatus}' म्हणून नोंदवली.`);
      setActionModal({ open: false, type: null, reason: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'स्थिती बदलताना त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualVerifyPhone = async (customerId) => {
    setActionLoading(true);
    try {
      await api.post(`/customers/${customerId}/manual-verify-phone`);
      toast.success('ग्राहकाचा मोबाइल नंबर प्रमाणित करण्यात आला.');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'मोबाइल प्रमाणीकरणात त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordModal.newPassword || passwordModal.newPassword.length < 4) {
      toast.error('किमान ४ अक्षरी पासवर्ड किंवा पिन टाका.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/customers/${selectedCustomer.id}/reset-password`, {
        newPassword: passwordModal.newPassword,
      });
      toast.success('ग्राहकाचा पासवर्ड यशस्वीरीत्या बदलण्यात आला.');
      setPasswordModal({ open: false, newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'पासवर्ड बदलताना त्रुटी आली.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    const matchesFilter =
      filterStatus === 'ALL' ||
      (filterStatus === 'PENDING_APPROVAL' && c.status === 'PENDING_APPROVAL') ||
      (filterStatus === 'APPROVED' && (c.status === 'APPROVED' || c.status === 'ACTIVE')) ||
      (filterStatus === 'REJECTED' && c.status === 'REJECTED') ||
      (filterStatus === 'SUSPENDED' && c.status === 'SUSPENDED');

    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const pendingCount = customers.filter((c) => c.status === 'PENDING_APPROVAL').length;
  const approvedCount = customers.filter((c) => c.status === 'APPROVED' || c.status === 'ACTIVE').length;
  const suspendedCount = customers.filter((c) => c.status === 'SUSPENDED').length;
  const rejectedCount = customers.filter((c) => c.status === 'REJECTED').length;

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D312E] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#205D48]" />
            <span>ग्राहक पडताळणी व मंजुरी (Customer Verification)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            नवीन नोंदणीकृत ग्राहकांची तपासणी, मंजुरी, निलंबन आणि मोबाइल प्रमाणीकरण.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-[#205D48] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#184837] active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>रिफ्रेश</span>
        </button>
      </div>

      {/* 4 Status KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus('PENDING_APPROVAL')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'PENDING_APPROVAL'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>मंजुरी प्रलंबित</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">{pendingCount}</div>
        </button>

        <button
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-white border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>मंजूर ग्राहक</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">{approvedCount}</div>
        </button>

        <button
          onClick={() => setFilterStatus('SUSPENDED')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'SUSPENDED'
              ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-300'
              : 'bg-white border-orange-200 hover:border-orange-300'
          }`}
        >
          <div className="text-[11px] font-bold text-orange-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>स्थगित</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-900 mt-1">{suspendedCount}</div>
        </button>

        <button
          onClick={() => setFilterStatus('REJECTED')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'REJECTED'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
              : 'bg-white border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>नाकारलेले</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1">{rejectedCount}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#EAE3D2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="नावाने, मोबाइल नंबरने किंवा ग्राहक कोडने शोधा..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#205D48]/30"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-[#205D48] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'सर्व'
                : st === 'PENDING_APPROVAL'
                ? 'प्रलंबित'
                : st === 'APPROVED'
                ? 'मंजूर'
                : st === 'SUSPENDED'
                ? 'स्थगित'
                : 'नाकारलेले'}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Verification Cards List (Mobile-Optimized) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="font-bold text-slate-700 text-sm">कोणतेही ग्राहक आढळले नाहीत.</div>
          <p className="text-xs text-slate-400">निवडलेल्या फिल्टरनुसार सध्या कोणतीही नोंदणी नाही.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((cust) => {
            const isPending = cust.status === 'PENDING_APPROVAL';
            const isApproved = cust.status === 'APPROVED' || cust.status === 'ACTIVE';
            const isSuspended = cust.status === 'SUSPENDED';
            const isRejected = cust.status === 'REJECTED';

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl p-4 border border-[#EAE3D2] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#205D48]/40 transition-all"
              >
                {/* Header: Name, CustomerCode, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{cust.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                        {cust.customerCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>नोंदणी: {new Date(cust.createdAt).toLocaleDateString('mr-IN')}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0 ${
                      isPending
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isApproved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isSuspended
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isPending ? 'मंजुरी प्रलंबित' : isApproved ? 'मंजूर' : isSuspended ? 'स्थगित' : 'नाकारलेले'}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="space-y-1 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.phone}</span>
                    </span>
                    {cust.phoneVerified ? (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>प्रमाणित</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleManualVerifyPhone(cust.id)}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        फोन प्रमाणित करा
                      </button>
                    )}
                  </div>

                  {cust.address && (
                    <div className="flex items-start gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{cust.address}</span>
                    </div>
                  )}

                  {cust.rejectionReason && (
                    <div className="text-[11px] text-rose-600 font-medium pt-1">
                      कारण: {cust.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Owner Actions Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                  {/* Approve */}
                  {!isApproved && (
                    <button
                      onClick={() => handleStatusChange(cust.id, 'APPROVED')}
                      className="flex-1 min-h-[36px] flex items-center justify-center gap-1 px-3 py-1.5 bg-[#205D48] hover:bg-[#184837] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>मंजूर करा (Approve)</span>
                    </button>
                  )}

                  {/* Reject */}
                  {isPending && (
                    <button
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setActionModal({ open: true, type: 'REJECTED', reason: '' });
                      }}
                      className="min-h-[36px] flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>नाकारा (Reject)</span>
                    </button>
                  )}

                  {/* Suspend */}
                  {isApproved && (
                    <button
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setActionModal({ open: true, type: 'SUSPENDED', reason: '' });
                      }}
                      className="flex-1 min-h-[36px] flex items-center justify-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>स्थगित करा (Suspend)</span>
                    </button>
                  )}

                  {/* Reactivate */}
                  {(isSuspended || isRejected) && (
                    <button
                      onClick={() => handleStatusChange(cust.id, 'APPROVED')}
                      className="flex-1 min-h-[36px] flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>पुन्हा सक्रिय करा</span>
                    </button>
                  )}

                  {/* Reset Password / PIN */}
                  <button
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setPasswordModal({ open: true, newPassword: '' });
                    }}
                    title="पासवर्ड / पिन रीसेट करा"
                    className="min-h-[36px] p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Reject / Suspend */}
      {actionModal.open && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>
                {actionModal.type === 'REJECTED' ? 'नोंदणी नाकारण्याची खात्री' : 'खाते स्थगित करण्याची खात्री'}
              </span>
            </h3>

            <p className="text-xs text-slate-600">
              ग्राहक <span className="font-bold text-slate-900">{selectedCustomer.name}</span> साठी ही कृती लागू
              करण्यापूर्वी कृपया कारण नमूद करा:
            </p>

            <input
              type="text"
              value={actionModal.reason}
              onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
              placeholder="कारणाचा तपशील (उदा. पत्ता अपूर्ण, देय बाकी, इत्यादी)..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#205D48]/30"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setActionModal({ open: false, type: null, reason: '' })}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                रद्द करा
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleStatusChange(selectedCustomer.id, actionModal.type, actionModal.reason)}
                className={`flex-1 py-2 text-xs font-bold text-white rounded-xl ${
                  actionModal.type === 'REJECTED'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {actionLoading ? 'प्रक्रिया सुरू...' : 'पुष्टी करा'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModal.open && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#205D48]" />
              <span>पासवर्ड किंवा पिन रीसेट करा</span>
            </h3>

            <p className="text-xs text-slate-600">
              ग्राहक <span className="font-bold text-slate-900">{selectedCustomer.name}</span> साठी नवीन पासवर्ड
              किंवा ४-अंकी पिन प्रविष्ट करा:
            </p>

            <input
              type="text"
              value={passwordModal.newPassword}
              onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
              placeholder="उदा. 1234 किंवा Customer@2026"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#205D48]/30"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPasswordModal({ open: false, newPassword: '' })}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                रद्द करा
              </button>
              <button
                disabled={actionLoading}
                onClick={handleResetPassword}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#205D48] hover:bg-[#184837] rounded-xl"
              >
                {actionLoading ? 'जतन होत आहे...' : 'पासवर्ड जतन करा'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
