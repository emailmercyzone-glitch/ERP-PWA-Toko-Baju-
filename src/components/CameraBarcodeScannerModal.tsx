import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Volume2, Flashlight } from 'lucide-react';
import { db } from '../services/db';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSKU: (sku: string) => void;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSKU,
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScannedSKU, setLastScannedSKU] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimestamp = useRef<number>(0);
  const containerId = 'camera-barcode-reader';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const formatted = devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Kamera ${index + 1}`
          }));
          setCameras(formatted);

          // Prefer back camera if available on mobile
          const backCam = formatted.find(
            (c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear')
          );
          const initialCamId = backCam ? backCam.id : formatted[0].id;
          setSelectedCameraId(initialCamId);
          startCamera(initialCamId);
        } else {
          setErrorMsg('Kamera tidak ditemukan di perangkat ini. Anda bisa memilih SKU secara manual.');
        }
      })
      .catch((err) => {
        console.error('Error fetching cameras:', err);
        setErrorMsg('Gagal mengakses izin kamera browser. Pastikan izin kamera telah diberikan.');
      });

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz beep
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // audio feedback fallback
    }
  };

  const startCamera = async (cameraId: string) => {
    await stopCamera();

    try {
      const html5Qrcode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });

      html5QrcodeRef.current = html5Qrcode;
      setIsScanning(true);
      setErrorMsg(null);

      await html5Qrcode.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.777
        },
        (decodedText) => {
          const now = Date.now();
          // Throttle duplicate scan within 1.5 seconds
          if (now - lastScanTimestamp.current < 1500 && decodedText === lastScannedSKU) {
            return;
          }

          lastScanTimestamp.current = now;
          setLastScannedSKU(decodedText);
          playBeepSound();

          // Verify if SKU exists in master database or matches barcode
          const matchedVarian = db.masterVarian.find(
            (v) => v.sku.toLowerCase() === decodedText.toLowerCase() || v.barcode_code128.toLowerCase() === decodedText.toLowerCase()
          );

          if (matchedVarian) {
            onScanSKU(matchedVarian.sku);
          } else {
            // Also allow passing raw scanned SKU text
            onScanSKU(decodedText);
          }
        },
        () => {
          // Scan frame failure (ignore)
        }
      );
    } catch (err: any) {
      console.error('Error starting camera barcode scanner:', err);
      setIsScanning(false);
      setErrorMsg(err?.message || 'Gagal memulai kamera.');
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping camera:', e);
      } finally {
        html5QrcodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCamId = e.target.value;
    setSelectedCameraId(newCamId);
    startCamera(newCamId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold">Scan Barcode SKU (Kamera Real-Time)</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Selector Toolbar */}
        {cameras.length > 1 && (
          <div className="flex items-center justify-between gap-2 text-xs bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400">Pilih Kamera:</span>
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Camera Viewfinder Viewport */}
        <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[260px] flex items-center justify-center">
          <div id={containerId} className="w-full h-full"></div>

          {/* Scanner Overlay Box */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-indigo-500 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1"></div>
                <div className="w-full h-0.5 bg-indigo-500 animate-pulse absolute top-1/2 -translate-y-1/2 shadow-lg"></div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 text-center text-xs text-rose-300 space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Last Scanned Feedback Toast */}
        {lastScannedSKU && (
          <div className="bg-emerald-950/90 border border-emerald-800 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-pulse">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Terscan: <strong className="font-mono">{lastScannedSKU}</strong> (Masuk Keranjang)</span>
            </div>
            <Volume2 className="w-4 h-4 text-emerald-400" />
          </div>
        )}

        {/* Quick SKU Test Chips */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Simulasi Scan SKU Cepat (Tanpa Kamera Device)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {db.masterVarian.map((v) => (
              <button
                key={v.sku}
                onClick={() => {
                  onScanSKU(v.sku);
                  setLastScannedSKU(v.sku);
                  playBeepSound();
                }}
                className="text-[10px] font-mono bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-700 text-slate-300 px-2.5 py-1 rounded-lg transition"
              >
                + {v.sku}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
