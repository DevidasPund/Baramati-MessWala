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
  Flashlight,
  FlashlightOff,
  AlertTriangle,
  Zap,
  Volume2,
  Check,
  User,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../../services/api';

// Audio chime using Web Audio API (zero external assets, 100% offline reliable)
const playChime = (type = 'success') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Pleasant high double beep
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else {
      // Low buzz for duplicate / rejected
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Audio context may be restricted by autoplay policy until user gesture
  }
};

export const AdminQrScannerPage = () => {
  const [mode, setMode] = useState('SCAN_CUSTOMER'); // 'SCAN_CUSTOMER' (Method B) or 'DISPLAY_MESS_QR' (Method A)
  const [mealType, setMealType] = useState('LUNCH');
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Rapid Scan (Continuous Hands-Free) Mode State
  const [rapidMode, setRapidMode] = useState(true);
  const [hudMessage, setHudMessage] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  // Method A Mess Session State
  const [messSession, setMessSession] = useState(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const scannerRef = useRef(null);
  const rapidModeRef = useRef(rapidMode);
  const lastScanRef = useRef({ token: '', timestamp: 0 });
  const isProcessingRef = useRef(false);

  // Keep rapidModeRef in sync with rapidMode state
  useEffect(() => {
    rapidModeRef.current = rapidMode;
  }, [rapidMode]);

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

  // Start Camera for Method B (Prefer Rear Camera)
  const startCamera = async () => {
    setScanning(true);
    setScanResult(null);
    setCameraError(null);
    setHasTorch(false);
    setTorchOn(false);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxEdge = Math.floor(minEdge * 0.75);
          return { width: Math.max(220, qrboxEdge), height: Math.max(220, qrboxEdge) };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          const now = Date.now();
          // Prevent multiple scans of the same QR code within 2.5 seconds
          if (lastScanRef.current.token === decodedText && now - lastScanRef.current.timestamp < 2500) {
            return;
          }
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          lastScanRef.current = { token: decodedText, timestamp: now };

          await handleProcessScan(decodedText, rapidModeRef.current);
          isProcessingRef.current = false;

          // If NOT in rapid continuous mode, stop camera for individual acknowledgement
          if (!rapidModeRef.current) {
            stopCamera();
          }
        },
        () => {}
      );

      // Inspect camera capabilities for torch support
      try {
        const track = html5QrCode.getRunningTrackCameraCapabilities();
        if (track && track.torchFeature && track.torchFeature().isSupported()) {
          setHasTorch(true);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Camera start error:', err);
      let errMsg = 'कॅमेरा सुरू करता आला नाही. कृपया खाली ग्राहकाचा QR टोकन कोड टाका.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errMsg = 'कॅमेरा परवानगी नाकारली आहे. कृपया ब्राउझर सेटिंग्जमधून कॅमेरा परवानगी चालू करा किंवा खाली थेट टोकन टाका.';
      } else if (err?.name === 'NotFoundError') {
        errMsg = 'या डिव्हाइसवर कॅमेरा सापडला नाही. कृपया खाली टोकन कोड टाका.';
      } else if (err?.name === 'NotReadableError') {
        errMsg = 'कॅमेरा इतर कोणत्याही ॲपमध्ये सुरू आहे. कृपया तो बंद करून पुन्हा प्रयत्न करा.';
      }
      setCameraError(errMsg);
      toast.error(errMsg);
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
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const track = scannerRef.current.getRunningTrackCameraCapabilities();
      if (track && track.torchFeature) {
        await track.torchFeature().apply(!torchOn);
        setTorchOn(!torchOn);
      }
    } catch (err) {
      console.warn('Torch toggle failed', err);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  // Process Scan (Method B: Staff/Admin Scans Customer QR)
  const handleProcessScan = async (tokenToUse, isRapid = false) => {
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

      playChime('success');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
      const successMsg = res.message || 'ग्राहकाची उपस्थिती यशस्वीरित्या नोंदवली.';

      const scanData = {
        success: true,
        message: successMsg,
        data: res.data,
      };

      setScanResult(scanData);

      // Add to recent counter queue
      setRecentScans((prev) => [
        {
          id: Date.now(),
          name: res.data?.customer?.name || 'ग्राहक',
          code: res.data?.customer?.code || '',
          plan: res.data?.plan || 'नियमित मेस',
          mealType,
          time: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          success: true,
        },
        ...prev.slice(0, 9),
      ]);

      if (isRapid) {
        setHudMessage({
          type: 'success',
          text: `✅ ${res.data?.customer?.name || 'ग्राहक'} (${res.data?.customer?.code || ''}) - हजेरी नोंदवली!`,
        });
        setTimeout(() => setHudMessage(null), 2200);
      } else {
        toast.success(successMsg);
      }

      setManualToken('');
    } catch (err) {
      playChime('error');
      const errorMsg = err.message || 'हजेरी पडताळणी अयशस्वी';

      setScanResult({
        success: false,
        message: errorMsg,
      });

      setRecentScans((prev) => [
        {
          id: Date.now(),
          name: 'अस्वीकृत',
          code: '',
          plan: errorMsg,
          mealType,
          time: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          success: false,
        },
        ...prev.slice(0, 9),
      ]);

      if (isRapid) {
        setHudMessage({
          type: 'error',
          text: `❌ ${errorMsg}`,
        });
        setTimeout(() => setHudMessage(null), 2500);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-10">
      {/* Mode Switcher Banner */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <button
          onClick={() => { stopCamera(); setMode('SCAN_CUSTOMER'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer ${
            mode === 'SCAN_CUSTOMER'
              ? 'bg-[#205D48] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>पद्धत २: ग्राहकाचा वैयक्तिक QR स्कॅन करा</span>
        </button>

        <button
          onClick={() => { stopCamera(); setMode('DISPLAY_MESS_QR'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer ${
            mode === 'DISPLAY_MESS_QR'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>पद्धत १: काउंटरवर मेस QR स्क्रीन दाखवा</span>
        </button>
      </div>

      {/* Meal Category & Rapid Mode Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-extrabold text-slate-700 tracking-wide">जेवणाची वेळ:</span>
          {[
            { id: 'BREAKFAST', label: 'नाश्ता', icon: Coffee },
            { id: 'LUNCH', label: 'दुपारचे जेवण', icon: Utensils },
            { id: 'DINNER', label: 'रात्रीचे जेवण', icon: Moon },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = mealType === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMealType(m.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-100 text-[#205D48] border border-emerald-300 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rapid Continuous Scan Toggle */}
        {mode === 'SCAN_CUSTOMER' && (
          <div className="flex items-center gap-2 bg-[#FAF6ED] px-3 py-1.5 rounded-xl border border-[#EAE3D2]">
            <Zap className={`w-4 h-4 ${rapidMode ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
            <span className="text-xs font-bold text-stone-700">फास्ट स्कॅन मोड:</span>
            <button
              type="button"
              onClick={() => setRapidMode(!rapidMode)}
              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                rapidMode
                  ? 'bg-[#205D48] text-white shadow-2xs'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {rapidMode ? 'चालू (ऑटो)' : 'बंद'}
            </button>
          </div>
        )}
      </div>

      {/* MODE B: Staff Scans Customer QR */}
      {mode === 'SCAN_CUSTOMER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scanner Viewport Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">कॅमेरा हजेरी स्कॅनर</h3>
                {rapidMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    <Zap className="w-2.5 h-2.5 fill-amber-600" />
                    <span>फास्ट मोड</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasTorch && scanning && (
                  <button
                    onClick={toggleTorch}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                      torchOn ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title="फ्लॅशलाइट"
                  >
                    {torchOn ? <Flashlight className="w-4 h-4 text-amber-600" /> : <FlashlightOff className="w-4 h-4" />}
                    <span className="text-[10px]">{torchOn ? 'बंद करा' : 'फ्लॅश'}</span>
                  </button>
                )}
                <span className="text-[10px] font-bold text-[#205D48] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {mealType === 'LUNCH' ? 'दुपार' : mealType === 'DINNER' ? 'रात्र' : 'नाश्ता'}
                </span>
              </div>
            </div>

            {/* Video Viewport with HUD Overlay */}
            <div className="w-full h-64 sm:h-72 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center text-slate-400">
              <div id="qr-reader-container" className="w-full h-full"></div>

              {/* Floating Live HUD Notification during Rapid Mode */}
              {hudMessage && (
                <div
                  className={`absolute top-3 left-3 right-3 p-3 rounded-xl shadow-lg border text-xs font-bold text-center animate-in fade-in slide-in-from-top-2 duration-200 z-20 ${
                    hudMessage.type === 'success'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-rose-600 text-white border-rose-500'
                  }`}
                >
                  {hudMessage.text}
                </div>
              )}

              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Camera className="w-10 h-10 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-300">
                    कॅमेरा स्टँडबाय आहे. ग्राहकाचा QR पास स्कॅन करण्यासाठी खाली क्लिक करा.
                  </p>
                </div>
              )}
            </div>

            {/* Camera Error Notice if any */}
            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>{cameraError}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!scanning ? (
                <button
                  onClick={startCamera}
                  className="flex-1 py-3 bg-[#205D48] hover:bg-[#184838] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs min-h-[44px] cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{rapidMode ? 'फास्ट कॅमेरा सुरू करा' : 'कॅमेरा सुरू करा'}</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors min-h-[44px] cursor-pointer"
                >
                  <span>कॅमेरा थांबवा</span>
                </button>
              )}
            </div>

            {/* Manual token input fallback */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                किंवा थेट ग्राहकाचा QR टोकन कोड टाका:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="उदा. bmw_qr_..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#205D48] font-mono min-h-[44px]"
                />
                <button
                  onClick={() => handleProcessScan(undefined, false)}
                  disabled={loading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-50 min-h-[44px] cursor-pointer"
                >
                  {loading ? '...' : 'तपासा'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Card: Result Detail & Live Counter Queue */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  {rapidMode ? 'काउंटर उपस्थिती यादी (Live Queue)' : 'स्कॅन पडताळणी निकाल'}
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {recentScans.length} स्कॅन झाले
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold">
                {rapidMode ? 'प्रत्येक स्कॅन नंतर रीफ्रेश न करता अखंड हजेरी नोंदवली जाईल.' : 'रिअल-टाइम हजेरी पडताळणी'}
              </p>
            </div>

            {/* In Rapid Mode, render the live queue stack */}
            {rapidMode ? (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {recentScans.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
                    <Zap className="w-8 h-8 mx-auto text-amber-500 opacity-60" />
                    <p className="text-xs font-semibold">फास्ट मोड सज्ज आहे. समोर QR धरताच सेकंदात नोंद होईल.</p>
                  </div>
                ) : (
                  recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        scan.success
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/70 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            scan.success ? 'bg-emerald-200/80 text-emerald-800' : 'bg-rose-200/80 text-rose-800'
                          }`}
                        >
                          {scan.success ? <Check className="w-4 h-4 font-black" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold truncate">{scan.name}</div>
                          <div className="text-[11px] opacity-75 truncate">{scan.plan}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[11px] font-bold opacity-70">
                        {scan.time}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : scanResult ? (
              <div
                className={`p-5 sm:p-6 rounded-2xl border text-center space-y-3 ${
                  scanResult.success
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/90 border-rose-200 text-rose-950'
                }`}
              >
                {scanResult.success ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <div>
                      <h4 className="text-base font-black text-slate-900">{scanResult.data?.customer?.name}</h4>
                      <p className="text-xs font-bold font-mono text-emerald-700">{scanResult.data?.customer?.code}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-xs border border-emerald-100 text-left space-y-1">
                      <div className="text-slate-600">प्लॅन: <strong>{scanResult.data?.plan}</strong></div>
                      <div className="text-slate-600">
                        जेवण: <strong>{mealType === 'LUNCH' ? 'दुपारचे जेवण' : mealType === 'DINNER' ? 'रात्रीचे जेवण' : 'नाश्ता'}</strong>
                      </div>
                      <div className="text-slate-600">
                        वेळ: <strong className="font-mono">{new Date().toLocaleTimeString('mr-IN')}</strong>
                      </div>
                    </div>
                    <span className="inline-block px-3 py-1 bg-[#205D48] text-white text-xs font-bold rounded-full">
                      {scanResult.message || 'ग्राहकाची उपस्थिती यशस्वीरित्या नोंदवली.'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                    <h4 className="text-base font-bold text-rose-950">हजेरी नाकारली गेली</h4>
                    <p className="text-xs font-semibold text-rose-800 leading-relaxed">
                      {scanResult.message}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
                <QrCode className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">ग्राहकाचा QR कोड स्कॅन करण्यासाठी सज्ज.</p>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
              <div>• एका वेळेच्या जेवणासाठी फक्त एकदाच हजेरी ग्राह्य धरली जाते.</div>
              <div>• जलद मोडमध्ये स्क्रीनवर हात न लावता सलग ५० ग्राहकांची हजेरी घेता येते.</div>
            </div>
          </div>
        </div>
      )}

      {/* MODE A: Display Mess Dynamic QR Screen for Customer Self-Scan */}
      {mode === 'DISPLAY_MESS_QR' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-[#205D48] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              पद्धत १: ग्राहकांसाठी स्वयं-हजेरी QR स्क्रीन
            </span>
            <h2 className="text-2xl font-black text-slate-900 pt-2">
              मेसमेट मोबाईल ॲपद्वारे स्कॅन करा
            </h2>
            <p className="text-xs text-stone-500 font-semibold">
              चालू जेवण सत्र: <strong className="text-[#205D48]">{mealType === 'LUNCH' ? 'दुपारचे जेवण' : mealType === 'DINNER' ? 'रात्रीचे जेवण' : 'नाश्ता'}</strong> ({new Date().toLocaleDateString('mr-IN')})
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
              <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs">सेशन लोड होत आहे...</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
              <RefreshCw className="w-4 h-4 text-[#205D48] animate-spin" />
              <span>पुढील रिफ्रेश: <strong className="text-slate-900 font-mono">{countdown} सेकंद</strong></span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              डायनॅमिक टोकनमुळे स्क्रीनशॉट शेअर करून परस्पर हजेरी नोंदवणे अशक्य आहे. केवळ प्रत्यक्ष मेसमध्ये उपस्थित राहूनच स्कॅन करता येते.
            </p>
          </div>

          <div>
            <button
              onClick={fetchMessSession}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors min-h-[44px] cursor-pointer"
            >
              आताच QR रिफ्रेश करा
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
