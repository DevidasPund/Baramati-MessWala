import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Camera, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export const CustomerScanMessQrPage = () => {
  const [scanning, setScanning] = useState(false);
  const [manualSessionToken, setManualSessionToken] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef(null);

  const startCamera = async () => {
    setScanning(true);
    setResult(null);

    try {
      const html5QrCode = new Html5Qrcode('mess-qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await submitMessScan(decodedText);
          stopCamera();
        },
        (error) => {}
      );
    } catch (err) {
      toast.error('कॅमेरा ॲक्सेस मिळाला नाही. तुम्ही खालील इनपुटमध्ये कोड टाकू शकता.');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {}
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const submitMessScan = async (sessionToken) => {
    if (!sessionToken) {
      toast.error('कृपया व्हॅलिड QR कोड स्कॅन करा किंवा कोड टाका');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/attendance/scan/mess-qr', { sessionToken });
      setResult({
        success: true,
        message: res.message || 'हजेरी यशस्वीरित्या नोंदवली गेली!',
        data: res.data,
      });
      toast.success(res.message || 'हजेरी यशस्वी!');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setResult({
        success: false,
        message: err.message || 'हजेरी नोंदवता आली नाही. कृपया पुन्हा प्रयत्न करा.',
      });
      toast.error(err.message || 'हजेरी अयशस्वी!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <Scan className="w-6 h-6 text-blue-600" />
          <span>मेस QR स्कॅनर (पद्धत १)</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          मेसच्या काऊंटरवरील डायनॅमिक QR कोड स्कॅन करून तात्काळ हजेरी नोंदवा
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
        {/* Camera Scanner Viewport */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 min-h-[280px] flex items-center justify-center border border-slate-800">
          <div id="mess-qr-reader" className="w-full h-full"></div>

          {!scanning && !result && (
            <div className="text-center p-6 space-y-3 z-10">
              <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto backdrop-blur-xs">
                <Camera className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium">
                कॅमेरा सुरू करण्यासाठी खालील बटण दाबा
              </p>
            </div>
          )}

          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-blue-400 border-dashed rounded-2xl animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Scan Actions */}
        <div className="flex gap-3">
          {!scanning ? (
            <button
              onClick={startCamera}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
            >
              <Camera className="w-4 h-4" />
              <span>कॅमेरा सुरू करा</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
            >
              <span>कॅमेरा थांबवा</span>
            </button>
          )}
        </div>

        {/* Manual Token Input Fallback */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            किंवा थेट टोकन / कोड टाका:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="मेस सेशन कोड प्रविष्ट करा..."
              value={manualSessionToken}
              onChange={(e) => setManualSessionToken(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={() => submitMessScan(manualSessionToken)}
              disabled={loading || !manualSessionToken}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
            >
              {loading ? 'नोंद होत आहे...' : 'सादर करा'}
            </button>
          </div>
        </div>

        {/* Scan Result Alert */}
        {result && (
          <div
            className={`p-4 rounded-2xl border ${
              result.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            } space-y-2`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
              <span>{result.message}</span>
            </div>
            {result.data && (
              <div className="text-xs space-y-1 pt-1 text-slate-700">
                <p>जेवणाचा प्रकार: <strong>{result.data.mealType}</strong></p>
                <p>तारीख: <strong>{new Date(result.data.date).toLocaleDateString('mr-IN')}</strong></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
