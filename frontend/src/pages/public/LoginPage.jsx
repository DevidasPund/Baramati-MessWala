import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res?.data?.token) {
        login(res.data.token, res.data.user);
        toast.success(`Welcome back, ${res.data.user.customer?.name || res.data.user.staff?.name || res.data.user.email}!`);

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
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click test credentials for easy review
  const fillCredentials = (type) => {
    if (type === 'admin') {
      setEmail('admin@baramatimesswala.com');
      setPassword('Baramati@Admin2026#');
    } else if (type === 'staff') {
      setEmail('staff@baramatimesswala.com');
      setPassword('Staff@123');
    } else if (type === 'customer') {
      setEmail('customer@baramatimesswala.com');
      setPassword('Customer@123');
    }
    toast.success(`Filled ${type.toUpperCase()} demo credentials`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Utensils className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Login to MessMate
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Baramati Messwala – Manage Your Mess, The Smart Way!
          </p>
        </div>

        {/* Quick Demo Fill Pills for Testing */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            ⚡ 1-Click Quick Demo Login:
          </span>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('staff')}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              🧑‍🍳 Staff
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('customer')}
              className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              🎓 Customer
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          New member?{' '}
          <Link to="/register" className="font-bold text-emerald-600 hover:underline">
            Register your mess subscription here
          </Link>
        </div>
      </div>
    </div>
  );
};
