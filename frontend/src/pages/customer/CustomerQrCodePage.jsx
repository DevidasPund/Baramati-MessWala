import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, ShieldCheck, CheckCircle2, User } from 'lucide-react';
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
      toast.success('QR कोड गॅलरीमध्ये सेव्ह केला!');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          माझा वैयक्तिक डायनिंग QR कोड
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          पद्धत २: जेवणाच्या वेळी मेस काऊंटरवर हा QR पास स्कॅन करण्यासाठी दाखवा
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="space-y-1 pb-4 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2">
            <User className="w-3.5 h-3.5" />
            <span>बारामती मेसवाला सभासद</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">{customer?.name}</h2>
          <p className="text-xs font-mono font-bold text-blue-600 tracking-wider">
            {customer?.customerCode}
          </p>
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
            <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400 font-medium">
              QR कोड तयार होत आहे...
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs text-slate-700 bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-left">
          <div className="flex items-center gap-2 font-bold text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>हजेरी नोंदणी नियम:</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            • आपल्या चालू सबस्क्रिप्शननुसार (दुपार / रात्र) दररोज वैध राहील.<br />
            • एका जेवणासाठी (दुपार किंवा रात्र) फक्त एकदाच हजेरी नोंदवली जाईल.<br />
            • मोबाईल स्क्रीनचा ब्राइटनेस स्पष्ट ठेवा जेणेकरून स्कॅनर जलद स्कॅन करेल.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
        >
          <Download className="w-4 h-4" />
          <span>QR कोड फोन गॅलरीमध्ये सेव्ह करा</span>
        </button>
      </div>
    </div>
  );
};
