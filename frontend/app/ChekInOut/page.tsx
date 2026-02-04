'use client';

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { attendanceService } from "@/services/attendance.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

// -------------------------------------------
// Elegant UI Components
// -------------------------------------------
function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium 
      ${active ? "text-green-600" : "text-gray-400"}`}
    >
      <CheckCircle2 className={`w-4 h-4 ${active ? "opacity-100" : "opacity-30"}`} />
      {label}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl font-semibold transition 
      ${disabled
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-black text-white hover:bg-gray-900"}`}
    >
      {children}
    </button>
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

  // -------------------------------------------
  // STEP 1 — AUTO GET LOCATION
  // -------------------------------------------
  useEffect(() => {
    setStatus("Getting current location…");

    if (!navigator.geolocation) {
      setStatus("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStatus("Location detected ✅");
      },
      () => {
        setStatus("Location access denied ❌");
      }
    );
  }, []);

  // -------------------------------------------
  // STEP 2 — AUTO START CAMERA
  // -------------------------------------------
  useEffect(() => {
    if (!coords) return;

    async function startCam() {
      try {
        setStatus("Starting camera…");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          setStatus("Ready for face scan ✅");
        }
      } catch {
        setStatus("Camera access denied ❌");
      }
    }

    startCam();
  }, [coords]);

  // -------------------------------------------
  // STEP 3 — MANUAL FACE CAPTURE
  // -------------------------------------------
  const handleFaceScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 350, 250);

    setFaceScanned(true);
    setStatus("Face captured successfully ✅");
  };

  // -------------------------------------------
  // STEP 4 — REAL BACKEND CHECK-IN
  // -------------------------------------------
  const handleCheckIn = async () => {
    if (!coords || !faceScanned || !cameraActive) {
      setStatus("All steps not complete ❌");
      return;
    }

    try {
      setSending(true);
      setStatus("Verifying with server…");

      const imageBase64 = canvasRef.current?.toDataURL("image/jpeg");

      if (!imageBase64) {
        setStatus("Failed to capture image ❌");
        return;
      }

      const data = await attendanceService.checkInFace({
        lat: coords.lat,
        lng: coords.lng,
        imageUrl: imageBase64,
        deviceInfo: navigator.userAgent,
      });

      const { faceMatched, locationValid, confidence } = data;

      if (!faceMatched) {
        setStatus("Face verification failed ❌");
        return;
      }

      if (!locationValid) {
        setStatus("You are outside the hospital premises ❌");
        return;
      }

      setStatus(`Checked In Successfully ✅ (Confidence: ${confidence})`);
    } catch (err: unknown) {
      setStatus(getApiErrorMessage(err, "Check-in failed due to server error ❌"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-xl p-6 space-y-6">

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Smart Face Attendance
        </h1>

        {/* Status text */}
        <p className="text-center text-sm text-gray-600">{status}</p>

        {/* Live preview card */}
        <div className="relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            width={350}
            height={250}
            className="hidden"
          />
        </div>

        {/* Status Indicators */}
        <div className="space-y-2">
          <StatusBadge active={!!coords} label="Location acquired" />
          <StatusBadge active={cameraActive} label="Camera active" />
          <StatusBadge active={faceScanned} label="Face scanned" />
        </div>

        {/* Scan Face Button */}
        <ActionButton onClick={handleFaceScan} disabled={!cameraActive}>
          Scan Face
        </ActionButton>

        {/* Check-in button */}
        <ActionButton
          disabled={!coords || !cameraActive || !faceScanned || sending}
          onClick={handleCheckIn}
        >
          {sending ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking In…
            </div>
          ) : (
            "Confirm Check-In"
          )}
        </ActionButton>
      </div>
    </div>
  );
}
