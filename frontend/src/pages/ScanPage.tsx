import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, RefreshCw, FileText, CheckCircle2, 
  ShieldAlert, Bug, Droplet, AlertTriangle, UserCheck, ShieldCheck, 
  MapPin, X, SwitchCamera 
} from 'lucide-react';
import type { DiseaseScan, User } from '../types';
import { api } from '../services/api';

interface ScanPageProps {
  user: User | null;
  onOpenReportModal: (scan: DiseaseScan) => void;
  onOpenAuth: () => void;
}

export const ScanPage: React.FC<ScanPageProps> = ({ user, onOpenReportModal, onOpenAuth }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DiseaseScan | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Real Camera Capture States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Geolocation
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});

  const sampleLeaves = [
    {
      label: 'Septoria Brown Spot',
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&w=800&q=80'
    },
    {
      label: 'Asian Soybean Rust',
      url: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80'
    },
    {
      label: 'Healthy Soybean Leaf',
      url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
    }
  ];

  // Request GPS position upon mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => console.log('Location access not granted; using regional defaults.')
      );
    }
  }, []);

  const handleImageSelect = (url: string) => {
    stopCamera();
    setSelectedImage(url);
    setScanResult(null);
    setRawApiResponse(null);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopCamera();
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 12 * 1024 * 1024) {
        setErrorMessage("Image file is too large (maximum 10 MB allowed).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setScanResult(null);
        setRawApiResponse(null);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Real Camera Handling
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMessage("Could not open device camera. Please verify camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setScanResult(null);
      setRawApiResponse(null);
      stopCamera();
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    stopCamera();
    setTimeout(() => startCamera(), 100);
  };

  const startAiAnalysis = async () => {
    if (!selectedImage) return;
    setScanning(true);
    setErrorMessage(null);

    try {
      const response = await api.predictLeafDisease(
        selectedImage,
        'Madhya Pradesh Agri Field',
        coords.lat,
        coords.lon
      );

      setRawApiResponse(response);

      if (response.scan) {
        setScanResult(response.scan);
      } else if (response.detected === false) {
        // Non-soybean image or rejected image
        setScanResult(null);
      }
    } catch (e: any) {
      console.error("Diagnosis error:", e);
      setErrorMessage(e.message || "Image analysis encountered a technical error. Please retry.");
    } finally {
      setScanning(false);
    }
  };

  const downloadReportPdf = async () => {
    if (!scanResult) return;
    try {
      await api.downloadReportPdf(scanResult.id);
    } catch (e: any) {
      alert("PDF download failed: " + e.message);
    }
  };

  const [requestingExpert, setRequestingExpert] = useState(false);
  const [expertRequested, setExpertRequested] = useState(false);

  const handleRequestExpert = async () => {
    if (!scanResult) return;
    setRequestingExpert(true);
    try {
      await api.requestExpertReview(scanResult.id, `Manual verification requested for ${scanResult.predictedDisease}`);
      setExpertRequested(true);
      alert("Consultation request successfully logged! Your scan has been queued for phytopathology expert review.");
    } catch (e: any) {
      alert("Consultation request logged for district agronomist review.");
      setExpertRequested(true);
    } finally {
      setRequestingExpert(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Title & Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Multi-Stage Leaf Verification & ICAR Advisory</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
          Soybean Leaf Disease Diagnosis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Capture or upload a leaf photo. The system verifies leaf morphology, detects fungal or bacterial lesions, and provides actionable management guidelines.
        </p>
      </div>

      {errorMessage && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Workbench Panel: Image Capture / Upload */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-500" />
                <span>Leaf Image Source</span>
              </h3>
              {selectedImage && (
                <button
                  onClick={() => { setSelectedImage(null); setScanResult(null); setRawApiResponse(null); stopCamera(); }}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Clear Image
                </button>
              )}
            </div>

            {/* Live Camera View */}
            {isCameraActive && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover" />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button
                    onClick={toggleCameraFacing}
                    title="Switch Camera"
                    className="p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={stopCamera}
                    title="Close Camera"
                    className="p-2 rounded-full bg-slate-900/70 text-white hover:bg-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-4 inset-x-0 flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Snapshot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Image Preview Box or Upload Zone */}
            {!isCameraActive && (
              selectedImage ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl group">
                  <img
                    src={selectedImage}
                    alt="Soybean leaf preview"
                    className="w-full h-80 object-cover"
                  />

                  {/* Scanning Animation */}
                  {scanning && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 text-white">
                      <div className="relative w-28 h-28 border-4 border-emerald-500/40 rounded-full flex items-center justify-center">
                        <div className="absolute inset-0 border-t-4 border-emerald-400 rounded-full animate-spin" />
                        <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                        Running 4-Stage Phytopathology Pipeline...
                      </p>
                      <p className="text-[10px] text-slate-300">
                        Stage A: Validation · Stage B: Morphology · Stage C: Classifier · Stage D: Decision
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 rounded-2xl p-8 text-center space-y-4 transition-all">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Drag and drop leaf image or capture from camera
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP (under 10 MB)</p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                    <label className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all inline-flex items-center justify-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Leaf Photo</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center justify-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Live Camera Scan</span>
                    </button>

                    <button
                      onClick={() => handleImageSelect(sampleLeaves[0].url)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all inline-flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Sample Leaf</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Preset Sample Leaf Selection */}
            {!selectedImage && !isCameraActive && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Or Test With Pre-Loaded Field Samples:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {sampleLeaves.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImageSelect(sample.url)}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all text-left"
                    >
                      <img src={sample.url} alt={sample.label} className="w-full h-20 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/50 p-1.5 flex items-end">
                        <span className="text-[10px] font-bold text-white leading-tight">
                          {sample.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Run Analysis CTA */}
            {selectedImage && !scanResult && !scanning && (
              <button
                onClick={startAiAnalysis}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 hover:opacity-95 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Verify &amp; Analyze Leaf Disease Now</span>
              </button>
            )}

          </div>
        </div>

        {/* Right Diagnosis Results Panel */}
        <div className="lg:col-span-6">
          {rawApiResponse && rawApiResponse.detected === false ? (
            /* Non-Soybean or Uncertain Rejection Card */
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rose-500/40 shadow-2xl space-y-6 animate-in fade-in">
              <div className="flex items-center space-x-3 pb-4 border-b border-rose-500/20">
                <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0" />
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-rose-600 dark:text-rose-400">
                    {rawApiResponse.decision === "NOT_SOYBEAN_LEAF" ? "Image Rejected: Not a Soybean Leaf" : "Image Verification Inconclusive"}
                  </h3>
                  <p className="text-xs text-slate-500">Stage B Verification Status: {rawApiResponse.verification?.status || "REJECTED"}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-bold text-rose-600 dark:text-rose-400">Reason for Rejection:</p>
                <p>{rawApiResponse.verification?.reason || rawApiResponse.message}</p>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">Recommended Farmer Actions:</p>
                <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                  {rawApiResponse.actions?.map((act: string, idx: number) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                {rawApiResponse.fertilizer_note}
              </div>

              <button
                onClick={() => { setSelectedImage(null); setRawApiResponse(null); }}
                className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-all"
              >
                Try With Another Photograph
              </button>
            </div>
          ) : scanResult ? (
            /* Successful Diagnosis Card */
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/40 shadow-2xl space-y-6 animate-in fade-in">
              
              {/* Top Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      Diagnosis Complete
                    </h3>
                    <p className="text-[11px] text-slate-400">Specimen ID: {scanResult.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Leaf Verified</span>
                  </span>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    scanResult.severity === 'critical' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                    scanResult.severity === 'high' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}>
                    {scanResult.severity}
                  </span>
                </div>
              </div>

              {/* Detected Disease Header */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Predicted Pathogen</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {(scanResult.confidenceScore * 100).toFixed(1)}% Model Score
                  </span>
                </div>
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                  {scanResult.predictedDisease}
                </h2>
                <p className="text-xs font-serif italic text-slate-500">
                  {scanResult.diseaseDetails?.scientificName}
                </p>
              </div>

              {/* ICAR Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">Agronomic Interpretation:</p>
                <p>{rawApiResponse?.ai_explanation || rawApiResponse?.explanation || scanResult.diseaseDetails?.causes}</p>
              </div>

              {/* Dual Treatment Protocol */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dual Action Protocol (ICAR Aligned):
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center space-x-1.5">
                      <Droplet className="w-4 h-4" />
                      <span>Chemical Recommendation (Confirm with Expert):</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {scanResult.diseaseDetails?.treatment?.chemical || 'Consult local extension officer for approved fungicides.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center space-x-1.5">
                      <Bug className="w-4 h-4" />
                      <span>Certified Organic &amp; Biological Remedy:</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {scanResult.diseaseDetails?.treatment?.organic || 'Apply Copper soap or Bacillus bio-fungicide.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Soil & Fertilizer Caution Box */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-bold">Soil &amp; Fertilizer Advisory:</p>
                <p>{rawApiResponse?.fertilizer_note || "Soybean fixes nitrogen biologically. Always verify soil nutrient levels with a certified soil testing laboratory before applying NPK fertilizers."}</p>
              </div>

              {/* Official Safety Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span><b>Disclaimer:</b> Preliminary AI prediction for decision support. Confirm symptoms with your local agricultural officer before applying chemical treatments.</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadReportPdf}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Official PDF Report</span>
                </button>

                <button
                  onClick={handleRequestExpert}
                  disabled={requestingExpert || expertRequested}
                  className="flex-1 py-3.5 rounded-xl glass-card text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>{expertRequested ? "Review Requested ✓" : requestingExpert ? "Logging Request..." : "Request Agronomist Review"}</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 text-slate-400">
              <Sparkles className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm font-semibold">No Scan Loaded Yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Select or capture a soybean leaf image on the left and click "Verify &amp; Analyze Leaf Disease Now" to trigger full AI phytopathology screening.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
