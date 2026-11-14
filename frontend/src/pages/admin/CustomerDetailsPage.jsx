import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  Download,
  RefreshCw,
  Clock,
  Receipt,
  IndianRupee,
  Utensils,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CustomerDetailsPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res?.data?.customer) {
        setCustomer(res.data.customer);
      }
    } catch (err) {
      toast.error('Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleRegenerateQr = async () => {
    if (!window.confirm('Regenerate QR token? The old QR code will immediately stop working.')) return;
    try {
      const res = await api.post(`/customers/${id}/regenerate-qr`);
      toast.success(res.message || 'QR Token regenerated');
      fetchCustomer();
    } catch (err) {
      toast.error('Failed to regenerate QR');
    }
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('customer-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${customer.customerCode}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading || !customer) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading customer profile...</div>;
  }

  const activeSub = customer.subscriptions?.find((s) => s.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>
        <span className="text-xs font-bold text-slate-400">ID: {customer.id}</span>
      </div>

      {/* Top Profile & QR Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customer Info */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900">{customer.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {customer.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">{customer.customerCode}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                <span className="font-bold text-slate-800">{customer.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                <span className="font-bold text-slate-800 truncate">{customer.email || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Joining Date</span>
                <span className="font-bold text-slate-800">{new Date(customer.joiningDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                <span className="font-bold text-slate-800">{customer.emergencyContact || 'Not provided'}</span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Hostel / Address</span>
                <span className="font-bold text-slate-800">{customer.address || 'Baramati, Maharashtra'}</span>
              </div>
            </div>
          </div>

          {/* Active Subscription Banner */}
          {activeSub ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active Subscription</span>
                <h4 className="text-sm font-bold text-emerald-950 mt-0.5">{activeSub.plan.name}</h4>
                <p className="text-[11px] text-emerald-700">
                  Valid from {new Date(activeSub.startDate).toLocaleDateString()} to {new Date(activeSub.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-900">₹{Number(activeSub.amount).toFixed(0)}</span>
                <span className="text-[10px] font-semibold text-emerald-700 block">Meals: {activeSub.plan.includedMeals.join(', ')}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-900">No Active Subscription</h4>
                <p className="text-[10px] text-amber-700">Assign a plan from the Subscriptions module to enable QR meal attendance.</p>
              </div>
              <Link
                to="/admin/subscriptions"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
              >
                Assign Plan
              </Link>
            </div>
          )}
        </div>

        {/* Right: Personal QR Code Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4 text-center flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 mb-2">
              <QrCode className="w-4 h-4" />
              <span>Personal Dining QR</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Attendance Scanner Code</h3>
            <p className="text-[11px] text-slate-400">Scan at mess counter to mark meal</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <QRCodeSVG
              id="customer-qr-code"
              value={customer.qrToken}
              size={160}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="text-[10px] font-mono text-slate-400 truncate px-2">
            Token: {customer.qrToken.slice(0, 16)}...
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadQr}
              className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handleRegenerateQr}
              title="Regenerate Token"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section: Attendance, Invoices, Payments, Extra Meals */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200 px-6 overflow-x-auto">
          {[
            { id: 'attendance', label: `Attendance (${customer.attendance?.length || 0})`, icon: Clock },
            { id: 'invoices', label: `Invoices (${customer.invoices?.length || 0})`, icon: Receipt },
            { id: 'payments', label: `Payments (${customer.payments?.length || 0})`, icon: IndianRupee },
            { id: 'extraMeals', label: `Extra Meals (${customer.extraMeals?.length || 0})`, icon: Utensils },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* Attendance History Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {customer.attendance?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Meal</th>
                        <th className="py-2.5 px-4">Scan Time</th>
                        <th className="py-2.5 px-4">Method</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.attendance.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{a.date}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-emerald-700">{a.mealType}</span>
                          </td>
                          <td className="py-2.5 px-4">{new Date(a.scanTime).toLocaleTimeString()}</td>
                          <td className="py-2.5 px-4 text-slate-500">{a.method}</td>
                          <td className="py-2.5 px-4">
                            <span className="text-emerald-600 font-bold">✓ Verified</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No attendance records yet.</p>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {customer.invoices?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Invoice #</th>
                        <th className="py-2.5 px-4">Month/Year</th>
                        <th className="py-2.5 px-4">Total Amount</th>
                        <th className="py-2.5 px-4">Balance Due</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Download PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-4">{inv.billingMonth}/{inv.billingYear}</td>
                          <td className="py-2.5 px-4 font-bold">₹{Number(inv.totalAmount).toFixed(0)}</td>
                          <td className="py-2.5 px-4 font-bold text-rose-600">₹{Number(inv.balanceDue).toFixed(0)}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <a
                              href={`/api/invoices/${inv.id}/pdf?token=${localStorage.getItem('messmate_token') || ''}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No invoices generated yet.</p>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {customer.payments?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Receipt #</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Method</th>
                        <th className="py-2.5 px-4">Ref/UTR</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{pay.paymentNumber}</td>
                          <td className="py-2.5 px-4 font-bold text-emerald-600">₹{Number(pay.amount).toFixed(0)}</td>
                          <td className="py-2.5 px-4">{pay.paymentMethod}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{pay.transactionRef || '-'}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pay.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">{new Date(pay.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No payments recorded yet.</p>
              )}
            </div>
          )}

          {/* Extra Meals Tab */}
          {activeTab === 'extraMeals' && (
            <div className="space-y-4">
              {customer.extraMeals?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Meal</th>
                        <th className="py-2.5 px-4">Qty</th>
                        <th className="py-2.5 px-4">Total Amount</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.extraMeals.map((em) => (
                        <tr key={em.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold">{em.date}</td>
                          <td className="py-2.5 px-4">{em.mealCategory}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{em.mealType}</td>
                          <td className="py-2.5 px-4">{em.count}</td>
                          <td className="py-2.5 px-4 font-bold text-emerald-600">₹{Number(em.totalAmount).toFixed(0)}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {em.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No extra meal bookings.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
