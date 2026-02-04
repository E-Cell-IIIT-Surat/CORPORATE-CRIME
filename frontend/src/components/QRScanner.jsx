import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, RefreshCw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const QRScanner = ({ onScanSuccess }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode('reader');
    startCamera();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCamera = async () => {
    setIsInitializing(true);
    try {
      // Get list of available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        throw new Error("No cameras found");
      }

      // Find rear camera (environment facing)
      const rearCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );

      // Use rear camera ID if found, otherwise try facingMode constraint
      const cameraId = rearCamera ? rearCamera.id : devices[devices.length - 1].id;

      await scannerRef.current.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopCamera();
          onScanSuccess(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera start error:", err);
      // Final fallback: try with facingMode constraint
      try {
        await scannerRef.current.start(
          { facingMode: { ideal: "environment" } },
          { fps: 15, qrbox: { width: 280, height: 280 } },
          (decodedText) => {
            stopCamera();
            onScanSuccess(decodedText);
          },
          () => {}
        );
        setIsCameraActive(true);
      } catch (retryErr) {
        console.error("Final camera fallback error:", retryErr);
        toast.error("Optics Malfunction: Camera access denied. Use Intel Upload.");
        setIsCameraActive(false);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error("Stop error:", err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loader = toast.loading("Processing image...");
    try {
      const result = await scannerRef.current.scanFile(file, true);
      toast.success("QR Code detected", { id: loader });
      onScanSuccess(result);
    } catch (err) {
      toast.error("No valid QR code found in image", { id: loader });
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* The Reader Container */}
      <div id="reader" className="w-full h-full"></div>

      {/* Cyber Scan Decorative Overlay */}
      {isCameraActive && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 border-[30px] sm:border-[60px] md:border-[120px] border-black/70" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 border-2 border-blue-500/20 rounded-2xl sm:rounded-[2rem]">
            <div className="absolute top-0 left-0 w-8 sm:w-12 h-8 sm:h-12 border-t-[4px] sm:border-t-[6px] border-l-[4px] sm:border-l-[6px] border-blue-600 rounded-tl-xl sm:rounded-tl-2xl shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            <div className="absolute top-0 right-0 w-8 sm:w-12 h-8 sm:h-12 border-t-[4px] sm:border-t-[6px] border-r-[4px] sm:border-r-[6px] border-blue-600 rounded-tr-xl sm:rounded-tr-2xl shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            <div className="absolute bottom-0 left-0 w-8 sm:w-12 h-8 sm:h-12 border-b-[4px] sm:border-b-[6px] border-l-[4px] sm:border-l-[6px] border-blue-600 rounded-bl-xl sm:rounded-bl-2xl shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            <div className="absolute bottom-0 right-0 w-8 sm:w-12 h-8 sm:h-12 border-b-[4px] sm:border-b-[6px] border-r-[4px] sm:border-r-[6px] border-blue-600 rounded-br-xl sm:rounded-br-2xl shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan shadow-[0_0_20px_rgba(96,165,250,0.6)]" />
          </div>
        </div>
      )}

      {/* Overlay UI */}
      {!isCameraActive && !isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617]/98 z-20 p-4 sm:p-10 text-center backdrop-blur-2xl overflow-y-auto">
          <div className="bg-red-500/10 p-4 sm:p-8 rounded-lg sm:rounded-[2rem] border border-red-500/20 mb-6 sm:mb-10 shadow-[0_0_40px_rgba(239,68,68,0.15)] animate-in zoom-in duration-500 flex-shrink-0">
            <XCircle size={40} className="text-red-500 animate-pulse sm:size-16" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 sm:mb-4 uppercase tracking-tighter italic">Signal Error</h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-6 sm:mb-12 max-w-xs font-bold leading-relaxed tracking-tight">
            Camera access denied. Upload image or retry.
          </p>
          <div className="flex flex-col w-full max-w-xs gap-2 sm:gap-4 flex-shrink-0">
            <button 
              onClick={startCamera}
              className="flex items-center justify-center gap-2 sm:gap-4 bg-blue-600 hover:bg-blue-500 text-white w-full py-2.5 sm:py-5 rounded-lg sm:rounded-2xl font-black uppercase tracking-[0.15em] text-[9px] sm:text-[10px] transition-all active:scale-95 shadow-[0_15px_30px_rgba(37,99,235,0.3)] group"
            >
              <Camera size={16} className="group-hover:rotate-12 transition-transform sm:size-5" /> <span className="hidden xs:inline">Retry</span><span className="inline xs:hidden">OK</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 sm:gap-4 bg-white/5 hover:bg-white/10 text-gray-300 w-full py-2.5 sm:py-5 rounded-lg sm:rounded-2xl font-black uppercase tracking-[0.15em] text-[9px] sm:text-[10px] transition-all border border-white/5 active:scale-95"
            >
              <Upload size={16} className="sm:size-5" /> <span className="hidden xs:inline">Upload</span><span className="inline xs:hidden">IMG</span>
            </button>
          </div>
        </div>
      )}

      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
          <div className="w-12 h-12 border-[4px] border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4 sm:mb-6" />
          <p className="text-blue-500 font-black text-[9px] sm:text-xs uppercase tracking-[0.5em] animate-pulse italic">Initializing</p>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-4 sm:bottom-12 left-0 w-full flex flex-col items-center gap-3 sm:gap-6 px-3 sm:px-8 z-40">
        <div className="flex gap-2 sm:gap-4 w-full max-w-xs sm:max-w-md">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 sm:gap-4 bg-black/60 backdrop-blur-2xl border-2 border-white/10 hover:bg-black/80 text-white py-2.5 sm:py-5 rounded-lg sm:rounded-2xl font-black uppercase tracking-[0.15em] text-[9px] sm:text-[10px] transition-all active:scale-95 shadow-2xl group"
          >
            <Upload size={14} className="text-blue-400 group-hover:scale-110 transition-transform sm:size-[18px]" />
            <span className="hidden xs:inline">Upload</span><span className="inline xs:hidden">IMG</span>
          </button>
          
          {!isCameraActive && (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 sm:gap-3 bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-8 py-2.5 sm:py-4 rounded-lg sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-xs transition-all active:scale-95 shadow-2xl group flex-shrink-0"
            >
              <Camera size={14} className="group-hover:rotate-12 transition-transform sm:size-[18px]" />
              <span className="hidden xs:inline">Retry</span><span className="inline xs:hidden">OK</span>
            </button>
          )}
        </div>
        
        <p className="text-[7px] sm:text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">
          Optics v4.0
        </p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*"
      />

      <div className="absolute top-3 sm:top-6 left-3 sm:left-6 z-40">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/5">
          <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-300">
            {isCameraActive ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
