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
      toast.error('ग्राहक तपशील लोड करण्यात अडचण आली');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleRegenerateQr = async () => {
    if (!window.confirm('QR टोकन पुन्हा तयार करायचे आहे का? जुना QR कोड तात्काळ अकार्यक्षम होईल.')) return;
    try {
      const res = await api.post(`/customers/${id}/regenerate-qr`);
      toast.success(res.message || 'नवीन QR कोड तयार केला!');
      fetchCustomer();
    } catch (err) {
      toast.error('QR कोड पुन्हा तयार करता आला नाही');
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
    return <div className="p-8 text-center text-xs text-slate-500 font-medium">ग्राहक तपशील लोड होत आहे...</div>;
  }

  const activeSub = customer.subscriptions?.find((s) => s.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ग्राहकांच्या यादीकडे परत जा</span>
        </Link>
        <span className="text-xs font-mono font-bold text-slate-400">ID: {customer.id}</span>
      </div>

      {/* Top Profile & QR Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customer Info */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900">{customer.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    customer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {customer.status === 'ACTIVE' ? 'सक्रिय सभासद' : 'निष्क्रिय'}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">{customer.customerCode}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">मोबाईल क्रमांक</span>
                <span className="font-bold text-slate-800 font-mono">{customer.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">ईमेल पत्ता</span>
                <span className="font-bold text-slate-800 truncate font-mono">{customer.email || 'उपलब्ध नाही'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">नोंदणी तारीख</span>
                <span className="font-bold text-slate-800">{new Date(customer.joiningDate).toLocaleDateString('mr-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">आणीबाणी संपर्क</span>
                <span className="font-bold text-slate-800 font-mono">{customer.emergencyContact || 'नोंद नाही'}</span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">स्थानिक पत्ता / वसतिगृह</span>
                <span className="font-bold text-slate-800">{customer.address || 'अहिल्यानगर / बारामती'}</span>
              </div>
            </div>
          </div>

          {/* Active Subscription Banner */}
          {activeSub ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">सक्रिय मेस सबस्क्रिप्शन</span>
                <h4 className="text-sm font-bold text-emerald-950 mt-0.5">{activeSub.plan.name}</h4>
                <p className="text-[11px] text-emerald-700">
                  वैधता: {new Date(activeSub.startDate).toLocaleDateString('mr-IN')} ते {new Date(activeSub.endDate).toLocaleDateString('mr-IN')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-900">₹{Number(activeSub.amount).toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-semibold text-emerald-700 block">जेवण: दुपार + रात्र</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-900">कोणतेही सक्रिय सबस्क्रिप्शन नाही</h4>
                <p className="text-[10px] text-amber-700">QR हजेरी सुरू करण्यासाठी या ग्राहकाला नवीन योजना जोडा.</p>
              </div>
              <Link
                to="/admin/subscriptions"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
              >
                योजना जोडा
              </Link>
            </div>
          )}
        </div>

        {/* Right: Personal QR Code Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4 text-center flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 mb-2">
              <QrCode className="w-4 h-4" />
              <span>वैयक्तिक डायनिंग QR कोड</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">हजेरी स्कॅनर कोड</h3>
            <p className="text-[11px] text-slate-400">मेस काऊंटरवर स्कॅन करण्यासाठी</p>
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
            टोकन: {customer.qrToken.slice(0, 16)}...
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadQr}
              className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>QR डाउनलोड करा</span>
            </button>
            <button
              onClick={handleRegenerateQr}
              title="नवीन QR टोकन तयार करा"
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
            { id: 'attendance', label: `दैनिक हजेरी (${customer.attendance?.length || 0})`, icon: Clock },
            { id: 'invoices', label: `मासिक बिले (${customer.invoices?.length || 0})`, icon: Receipt },
            { id: 'payments', label: `पेमेंट इतिहास (${customer.payments?.length || 0})`, icon: IndianRupee },
            { id: 'extraMeals', label: `अतिरिक्त जेवणे (${customer.extraMeals?.length || 0})`, icon: Utensils },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
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
                        <th className="py-2.5 px-4">तारीख</th>
                        <th className="py-2.5 px-4">जेवणाची वेळ</th>
                        <th className="py-2.5 px-4">स्कॅन वेळ</th>
                        <th className="py-2.5 px-4">पद्धत</th>
                        <th className="py-2.5 px-4">स्थिती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.attendance.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{a.date}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-blue-700">
                              {a.mealType === 'LUNCH' ? 'दुपारचे जेवण' : a.mealType === 'DINNER' ? 'रात्रीचे जेवण' : 'नाश्ता'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono">{new Date(a.scanTime).toLocaleTimeString('mr-IN')}</td>
                          <td className="py-2.5 px-4 text-slate-500">{a.method === 'CUSTOMER_QR' ? 'काउंटर स्कॅन' : 'मॅन्युअल नोंद'}</td>
                          <td className="py-2.5 px-4">
                            <span className="text-emerald-600 font-bold">✓ नोंद झाली</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">अद्याप कोणतीही हजेरी नोंद नाही.</p>
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
                        <th className="py-2.5 px-4">इनव्हॉइस क्र.</th>
                        <th className="py-2.5 px-4">महिना / वर्ष</th>
                        <th className="py-2.5 px-4">एकूण रक्कम</th>
                        <th className="py-2.5 px-4">बाकी रक्कम</th>
                        <th className="py-2.5 px-4">स्थिती</th>
                        <th className="py-2.5 px-4 text-right">PDF डाउनलोड</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold font-mono text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-4">{inv.billingMonth}/{inv.billingYear}</td>
                          <td className="py-2.5 px-4 font-bold">₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-4 font-bold text-rose-600">₹{Number(inv.balanceDue).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {inv.status === 'PAID' ? 'पूर्ण भरले' : 'बाकी'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <a
                              href={`/api/invoices/${inv.id}/pdf?token=${localStorage.getItem('messmate_token') || ''}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
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
                <p className="text-xs text-slate-400 text-center py-8">कोणतेही बिल उपलब्ध नाही.</p>
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
                        <th className="py-2.5 px-4">तारीख</th>
                        <th className="py-2.5 px-4">रक्कम</th>
                        <th className="py-2.5 px-4">पद्धत</th>
                        <th className="py-2.5 px-4">UTR / संदर्भ क्र.</th>
                        <th className="py-2.5 px-4">स्थिती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4">{new Date(p.paymentDate).toLocaleDateString('mr-IN')}</td>
                          <td className="py-2.5 px-4 font-bold text-emerald-600">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-4 font-bold">{p.paymentMethod}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{p.transactionId || '—'}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              मंजूर (Verified)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">अद्याप कोणताही पेमेंट रेकॉर्ड नाही.</p>
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
                        <th className="py-2.5 px-4">तारीख</th>
                        <th className="py-2.5 px-4">जेवण</th>
                        <th className="py-2.5 px-4">नग</th>
                        <th className="py-2.5 px-4">दर</th>
                        <th className="py-2.5 px-4">स्थिती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customer.extraMeals.map((em) => (
                        <tr key={em.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4">{new Date(em.date).toLocaleDateString('mr-IN')}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{em.mealType}</td>
                          <td className="py-2.5 px-4">{em.quantity}</td>
                          <td className="py-2.5 px-4 font-bold">₹{Number(em.totalPrice).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              मंजूर
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">अतिरिक्त जेवणाची नोंद नाही.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
