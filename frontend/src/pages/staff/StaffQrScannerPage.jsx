import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Camera, CheckCircle2, AlertCircle, Coffee, Utensils, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export const StaffQrScannerPage = () => {
  const [mealType, setMealType] = useState('LUNCH');
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) setMealType('BREAKFAST');
    else if (hour >= 11 && hour < 16) setMealType('LUNCH');
    else setMealType('DINNER');
  }, []);

  const startCamera = async () => {
    setScanning(true);
    setResult(null);

    try {
      const html5QrCode = new Html5Qrcode('staff-qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await submitScan(decodedText);
        },
        (error) => {}
      );
    } catch (err) {
      toast.error('Camera access failed. Use manual token input.');
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

  const submitScan = async (tokenToUse) => {
    const qrToken = tokenToUse || manualToken.trim();
    if (!qrToken) {
      toast.error('Please scan or enter customer QR token');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/attendance/scan-customer-qr', {
        qrToken,
        mealType,
      });

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      toast.success(res.message || 'Attendance Marked!');
      setResult({
        success: true,
        customer: res.data?.customer,
        plan: res.data?.plan,
      });
      setManualToken('');
    } catch (err) {
      toast.error(err.message || 'Validation failed');
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
        <h2 className="text-xl font-bold text-slate-900">Staff QR Scanner</h2>
        <p className="text-xs text-slate-500">Scan customer personal passes to confirm dining entry</p>
      </div>

      {/* Meal Selection */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-around">
        {['BREAKFAST', 'LUNCH', 'DINNER'].map((m) => (
          <button
            key={m}
            onClick={() => setMealType(m)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mealType === m
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {m.charAt(0) + m.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5">
        {/* Camera Container */}
        <div className="w-full h-64 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center text-slate-400">
          <div id="staff-qr-reader" className="w-full h-full"></div>
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Camera className="w-10 h-10 text-slate-500" />
              <p className="text-xs text-slate-300">Tap below to activate camera scanner</p>
            </div>
          )}
        </div>

        <div>
          {!scanning ? (
            <button
              onClick={startCamera}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
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

        {/* Manual Input */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Or Paste QR Token / Customer Token:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="bmw_qr_..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => submitScan()}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? '...' : 'Mark'}
            </button>
          </div>
        </div>

        {/* Scan Result Alert */}
        {result && (
          <div className={`p-4 rounded-2xl border text-center space-y-2 text-xs ${
            result.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {result.success ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm">{result.customer?.name} ({result.customer?.code})</h4>
                <p className="text-emerald-700 font-semibold text-[11px]">Meal Verified ({mealType})</p>
                <div className="text-[10px] text-slate-500">Plan: {result.plan}</div>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="font-bold text-sm">Attendance Blocked</h4>
                <p className="text-rose-700 text-[11px] leading-relaxed">{result.message}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
