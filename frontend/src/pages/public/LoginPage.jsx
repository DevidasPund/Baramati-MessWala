import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Lock, Phone, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck, KeyRound, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('कृपया मोबाइल नंबर / ईमेल आणि पासवर्ड प्रविष्ट करा.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: identifier.trim(),
        phone: identifier.trim(),
        password,
      });

      if (res?.data?.token) {
        login(res.data.token, res.data.user);
        const name = res.data.user.customer?.name || res.data.user.staff?.name || res.data.user.email;
        toast.success(`स्वागत आहे, ${name}!`);

        // Navigate based on role
        const role = res.data.user.role;
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'STAFF') {
          navigate('/staff/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes('Invalid') || errorMsg.includes('password')) {
        toast.error('अवैध मोबाइल नंबर किंवा पासवर्ड. कृपया योग्य माहिती भरा.');
      } else if (errorMsg.includes('deactivated')) {
        toast.error('आपले खाते स्थगित केले आहे. कृपया मेस व्यवस्थापकाशी संपर्क साधा.');
      } else {
        toast.error(errorMsg || 'लॉगिन अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click test credentials for easy review
  const fillCredentials = (type) => {
    if (type === 'customer') {
      setActiveTab('customer');
      setIdentifier('customer@baramatimesswala.com'); // Or 9822334455
      setPassword('Customer@123');
      toast.success('ग्राहक लॉगिन माहिती भरली (Customer Demo)');
    } else if (type === 'admin') {
      setActiveTab('admin');
      setIdentifier('admin@baramatimesswala.com');
      setPassword('Baramati@Admin2026#');
      toast.success('व्यवस्थापक लॉगिन माहिती भरली (Admin Demo)');
    } else if (type === 'staff') {
      setActiveTab('admin');
      setIdentifier('staff@baramatimesswala.com');
      setPassword('Staff@123');
      toast.success('कर्मचारी लॉगिन माहिती भरली (Staff Demo)');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Main Login Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 backdrop-blur-md">
          {/* Header & Logo */}
          <div className="text-center space-y-3 mb-8">
            <Link to="/" className="inline-flex items-center justify-center group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-105 transition-transform">
                <Utensils className="w-8 h-8" />
              </div>
            </Link>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'customer' ? 'मेस हजेरी प्रणाली' : 'व्यवस्थापन पोर्टल'}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {activeTab === 'customer' ? 'आपल्या खात्यात लॉगिन करा' : 'मेस प्रशासक व स्टाफ लॉगिन'}
              </p>
            </div>

            {/* Portal Switch Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl max-w-xs mx-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('customer')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'customer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ग्राहक लॉगिन
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                व्यवस्थापक / स्टाफ
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {activeTab === 'customer' ? 'मोबाइल नंबर किंवा ईमेल' : 'ईमेल पत्ता'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {activeTab === 'customer' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type={activeTab === 'customer' ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'customer' ? 'उदा. 9822334455 किंवा ईमेल' : 'admin@baramatimesswala.com'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  पासवर्ड
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  पासवर्ड विसरलात?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="आपला पासवर्ड टाका"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>पडताळणी करत आहे...</span>
                </>
              ) : (
                <>
                  <span>लॉगिन करा</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Login Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>⚡ १-क्लिक चाचणी लॉगिन:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('customer')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-all text-center truncate"
              >
                👤 ग्राहक
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition-all text-center truncate"
              >
                👑 व्यवस्थापक
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff')}
                className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all text-center truncate"
              >
                🧑‍🍳 स्टाफ
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-white/80 space-y-1">
          <p>© {new Date().getFullYear()} बारामती मेसवाला • MessMate</p>
          <p className="text-white/60 text-[11px]">श्रीराम चौक, पाईपलाईन रोड, अहिल्यानगर • हेल्पलाईन: +९१ ९२०९१ ८४०३५</p>
        </div>
      </div>
    </div>
  );
};
