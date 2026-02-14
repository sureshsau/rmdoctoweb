'use client';

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Camera, Scan, Shield } from "lucide-react";
import { attendanceService } from "@/services/attendance.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 text-sm font-medium rounded-xl px-4 py-2.5 border transition-colors
        ${active ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}
    >
      <CheckCircle2 className={`w-5 h-5 shrink-0 ${active ? "text-teal-600" : "opacity-40"}`} />
      {label}
    </div>
  );
}

export default function CheckInOutPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceScanned, setFaceScanned] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setStatus("Getting current location…");
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("Location detected");
      },
      () => setStatus("Location access denied")
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    async function startCam() {
      try {
        setStatus("Starting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          setStatus("Ready for face scan");
        }
      } catch {
        setStatus("Camera access denied");
      }
    }
    startCam();
  }, [coords]);

  const handleFaceScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 350, 250);
    setFaceScanned(true);
    setStatus("Face captured successfully");
  };

  const handleCheckIn = async () => {
    if (!coords || !faceScanned || !cameraActive) {
      setStatus("Complete all steps above first");
      return;
    }
    try {
      setSending(true);
      setStatus("Verifying with server…");
      const imageBase64 = canvasRef.current?.toDataURL("image/jpeg");
      if (!imageBase64) {
        setStatus("Failed to capture image");
        return;
      }
      const res = await attendanceService.checkInFace({
        lat: coords.lat,
        lng: coords.lng,
        imageUrl: imageBase64,
        deviceInfo: navigator.userAgent,
      });
      const success = res?.success === true;
      const payload = res?.data ?? res;
      if (!success) {
        setStatus(res?.message || "Check-in failed");
        return;
      }
      const action = payload?.action;
      const actionLabel = action === "CHECK_OUT" ? "Checked Out" : "Checked In";
      const extra = payload?.workedHours != null ? ` (${payload.workedHours}h worked)` : "";
      setStatus(`${actionLabel} successfully${extra}`);
    } catch (err: unknown) {
      setStatus(getApiErrorMessage(err, "Check-in failed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header strip */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Face Verification
            </h1>
            <p className="text-slate-500 text-sm mt-1">Secure attendance for hospital & staff</p>
          </div>

          <p className="text-center text-sm font-medium text-slate-600 bg-slate-50 rounded-xl py-3 px-4 border border-slate-100">
            {status}
          </p>

          {/* Camera view with oval overlay hint */}
          <div className="relative w-full aspect-[4/3] max-h-64 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} width={350} height={250} className="hidden" />
            {/* Oval face guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-56 rounded-[50%] border-4 border-white/80 shadow-inner" style={{ borderStyle: "solid" }} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <StatusBadge active={!!coords} label="Location" />
            <StatusBadge active={cameraActive} label="Camera" />
            <StatusBadge active={faceScanned} label="Face scan" />
          </div>

          <button
            type="button"
            onClick={handleFaceScan}
            disabled={!cameraActive}
            className="w-full py-3.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <Scan className="w-5 h-5" />
            Capture Face
          </button>

          <button
            type="button"
            disabled={!coords || !cameraActive || !faceScanned || sending}
            onClick={handleCheckIn}
            className="w-full py-4 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition-all"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm Check-In
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
