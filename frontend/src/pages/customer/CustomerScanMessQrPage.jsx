import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Camera, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
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
      toast.error('Could not access camera. You can enter the session token below.');
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
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch (e) {}
      }
    };
  }, []);

  const submitMessScan = async (tokenToUse) => {
    const sessionToken = tokenToUse || manualSessionToken.trim();
    if (!sessionToken) {
      toast.error('Please scan or enter session token');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/attendance/scan-mess-qr', { sessionToken });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success(res.message || 'Attendance marked successfully!');
      setResult({
        success: true,
        message: res.message,
        plan: res.data?.plan,
        attendance: res.data?.attendance,
      });
      setManualSessionToken('');
    } catch (err) {
      toast.error(err.message || 'Scan failed');
      setResult({
        success: false,
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Scan Mess Counter QR</h2>
        <p className="text-xs text-slate-500">Method A: Point your camera at the live QR screen on counter</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5">
        {/* Viewport */}
        <div className="w-full h-64 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center text-slate-400">
          <div id="mess-qr-reader" className="w-full h-full"></div>
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Camera className="w-10 h-10 text-slate-500" />
              <p className="text-xs text-slate-300">Tap below to scan the Mess QR on counter display</p>
            </div>
          )}
        </div>

        <div>
          {!scanning ? (
            <button
              onClick={startCamera}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Scanner</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Stop Camera
            </button>
          )}
        </div>

        {/* Manual Entry Fallback */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Or Paste Live Mess Token:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="bmw_sess_..."
              value={manualSessionToken}
              onChange={(e) => setManualSessionToken(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => submitMessScan()}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? '...' : 'Claim Meal'}
            </button>
          </div>
        </div>

        {/* Result Box */}
        {result && (
          <div className={`p-4 rounded-2xl border text-center space-y-2 text-xs ${
            result.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {result.success ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm">Meal Confirmed!</h4>
                <p className="text-emerald-700 text-[11px]">{result.message}</p>
                <div className="text-[10px] text-slate-500">Plan: <strong>{result.plan}</strong></div>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="font-bold text-sm">Scan Rejected</h4>
                <p className="text-rose-700 text-[11px]">{result.message}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
