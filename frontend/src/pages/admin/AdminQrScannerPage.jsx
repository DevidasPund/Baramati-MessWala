import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Utensils,
  Coffee,
  Moon,
  Tv,
  Scan,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../../services/api';

export const AdminQrScannerPage = () => {
  const [mode, setMode] = useState('SCAN_CUSTOMER'); // 'SCAN_CUSTOMER' (Method B) or 'DISPLAY_MESS_QR' (Method A)
  const [mealType, setMealType] = useState('LUNCH');
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Method A Mess Session State
  const [messSession, setMessSession] = useState(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const scannerRef = useRef(null);

  // Auto detect meal type based on current local time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) setMealType('BREAKFAST');
    else if (hour >= 11 && hour < 16) setMealType('LUNCH');
    else setMealType('DINNER');
  }, []);

  // Fetch Mess Session for Method A
  const fetchMessSession = async () => {
    try {
      const res = await api.get(`/attendance/mess-qr-session?mealType=${mealType}`);
      if (res?.data) {
        setMessSession(res.data);
        const expires = new Date(res.data.expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
        setCountdown(diff);
      }
    } catch (err) {
      toast.error('मेस QR सेशन तयार करता आले नाही');
    }
  };

  useEffect(() => {
    if (mode === 'DISPLAY_MESS_QR') {
      fetchMessSession();
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchMessSession();
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, mealType]);

  // Start Camera for Method B
  const startCamera = async () => {
    setScanning(true);
    setScanResult(null);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          await handleProcessScan(decodedText);
          stopCamera();
        },
        (errorMessage) => {}
      );
    } catch (err) {
      console.error('Camera start error:', err);
      toast.error('कॅमेरा सुरू करता आला नाही. कृपया खाली ग्राहकाचा QR टोकन कोड टाका.');
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

  // Process Scan (Method B: Staff Scans Customer QR)
  const handleProcessScan = async (tokenToUse) => {
    const token = tokenToUse || manualToken.trim();
    if (!token) {
      toast.error('कृपया ग्राहकाचा QR कोड स्कॅन करा किंवा टोकन टाका');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/attendance/scan-customer-qr', {
        qrToken: token,
        mealType,
      });

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      toast.success(res.message || 'हजेरी यशस्वीरित्या नोंदवली गेली!');
      setScanResult({
        success: true,
        message: res.message,
        data: res.data,
      });
      setManualToken('');
    } catch (err) {
      toast.error(err.message || 'हजेरी पडताळणी अयशस्वी');
      setScanResult({
        success: false,
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mode Switcher Banner */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
        <button
          onClick={() => { stopCamera(); setMode('SCAN_CUSTOMER'); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'SCAN_CUSTOMER'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>पद्धत २: ग्राहकाचा वैयक्तिक QR स्कॅन करा</span>
        </button>

        <button
          onClick={() => { stopCamera(); setMode('DISPLAY_MESS_QR'); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'DISPLAY_MESS_QR'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>पद्धत १: काउंटरवर मेस QR स्क्रीन दाखवा</span>
        </button>
      </div>

      {/* Meal Category Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">सध्याची जेवणाची वेळ:</span>
        <div className="flex items-center gap-2">
          {[
            { id: 'BREAKFAST', label: 'नाश्ता', icon: Coffee },
            { id: 'LUNCH', label: 'दुपारचे जेवण', icon: Utensils },
            { id: 'DINNER', label: 'रात्रीचे जेवण', icon: Moon },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMealType(m.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                  mealType === m.id
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE B: Staff Scans Customer QR */}
      {mode === 'SCAN_CUSTOMER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scanner Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">कॅमेरा हजेरी स्कॅनर</h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {mealType === 'LUNCH' ? 'दुपार' : mealType === 'DINNER' ? 'रात्र' : 'नाश्ता'}
              </span>
            </div>

            {/* Video Viewport */}
            <div className="w-full h-64 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center text-slate-400">
              <div id="qr-reader-container" className="w-full h-full"></div>
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Camera className="w-10 h-10 text-slate-500" />
                  <p className="text-xs font-medium text-slate-300">
                    कॅमेरा स्टँडबाय आहे. ग्राहकाचा पास स्कॅन करण्यासाठी खाली क्लिक करा.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!scanning ? (
                <button
                  onClick={startCamera}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>कॅमेरा सुरू करा</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>कॅमेरा थांबवा</span>
                </button>
              )}
            </div>

            {/* Manual token input fallback */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                किंवा थेट ग्राहकाचा QR टोकन कोड टाका:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="उदा. bmw_qr_..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={() => handleProcessScan()}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? '...' : 'तपासा'}
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">स्कॅन पडताळणी निकाल</h3>
              <p className="text-xs text-slate-400">रिअल-टाइम हजेरी पडताळणी</p>
            </div>

            {scanResult ? (
              <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                scanResult.success
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}>
                {scanResult.success ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <div>
                      <h4 className="text-base font-black text-slate-900">{scanResult.data?.customer?.name}</h4>
                      <p className="text-xs font-bold font-mono text-emerald-700">{scanResult.data?.customer?.code}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-xs border border-emerald-100 text-left space-y-1">
                      <div className="text-slate-500">योजना: <strong>{scanResult.data?.plan}</strong></div>
                      <div className="text-slate-500">जेवण: <strong>{mealType === 'LUNCH' ? 'दुपारचे जेवण' : mealType === 'DINNER' ? 'रात्रीचे जेवण' : 'नाश्ता'}</strong></div>
                      <div className="text-slate-500">वेळ: <strong className="font-mono">{new Date().toLocaleTimeString('mr-IN')}</strong></div>
                    </div>
                    <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                      हजेरी नोंदवली गेली ✓
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                    <h4 className="text-base font-bold text-rose-900">हजेरी नाकारली गेली</h4>
                    <p className="text-xs font-medium text-rose-700 leading-relaxed">
                      {scanResult.message}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
                <QrCode className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">ग्राहकाचा QR कोड स्कॅन करण्यासाठी सज्ज.</p>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
              <div>• एका वेळेच्या जेवणासाठी फक्त एकदाच हजेरी ग्राह्य धरली जाते.</div>
              <div>• एकाच जेवणाच्या सत्रात पुन्हा स्कॅन केल्यास सिस्टीम आपोआप ब्लॉक करते.</div>
            </div>
          </div>
        </div>
      )}

      {/* MODE A: Display Mess Dynamic QR Screen for Customer Self-Scan */}
      {mode === 'DISPLAY_MESS_QR' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              पद्धत १: ग्राहकांसाठी स्वयं-हजेरी QR स्क्रीन
            </span>
            <h2 className="text-2xl font-black text-slate-900 pt-2">
              मेसमेट मोबाईल ॲपद्वारे स्कॅन करा
            </h2>
            <p className="text-xs text-slate-500">
              चालू जेवण सत्र: <strong className="text-blue-700">{mealType === 'LUNCH' ? 'दुपारचे जेवण' : mealType === 'DINNER' ? 'रात्रीचे जेवण' : 'नाश्ता'}</strong> ({new Date().toLocaleDateString('mr-IN')})
            </p>
          </div>

          {/* Large Live Dynamic QR */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 inline-block shadow-inner mx-auto">
            {messSession?.sessionToken ? (
              <QRCodeSVG
                value={messSession.sessionToken}
                size={260}
                level="H"
                includeMargin={true}
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">सेशन लोड होत आहे...</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span>पुढील रिफ्रेश: <strong className="text-slate-900 font-mono">{countdown} सेकंद</strong></span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              डायनॅमिक टोकनमुळे स्क्रीनशॉट शेअर करून परस्पर हजेरी नोंदवणे अशक्य आहे. केवळ प्रत्यक्ष मेसमध्ये उपस्थित राहूनच स्कॅन करता येते.
            </p>
          </div>

          <div>
            <button
              onClick={fetchMessSession}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              आताच QR रिफ्रेश करा
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
