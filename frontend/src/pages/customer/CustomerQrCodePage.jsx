import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export const CustomerQrCodePage = () => {
  const { user } = useAuth();
  const customer = user?.customer;

  const handleDownload = () => {
    const svg = document.getElementById('my-personal-qr');
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
      downloadLink.download = `${customer?.customerCode || 'Baramati_Messwala'}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR Code downloaded!');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Personal Dining QR Pass</h2>
        <p className="text-xs text-slate-500">Method B: Show this pass at the counter during meal hours</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="space-y-1 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900">{customer?.name}</h3>
          <p className="text-xs font-mono font-bold text-emerald-600">{customer?.customerCode}</p>
        </div>

        {/* High resolution QR */}
        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 inline-block shadow-inner mx-auto">
          {customer?.qrToken ? (
            <QRCodeSVG
              id="my-personal-qr"
              value={customer.qrToken}
              size={220}
              level="H"
              includeMargin={true}
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
              Generating pass...
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs text-slate-600 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-left">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Attendance Verification Rules:</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            • Valid for your active subscription meals (Breakfast, Lunch, Dinner).<br />
            • Only 1 scan per meal category per date is allowed.<br />
            • Keep your screen brightness clear when scanning.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
        >
          <Download className="w-4 h-4" />
          <span>Save QR to Phone Gallery</span>
        </button>
      </div>
    </div>
  );
};
