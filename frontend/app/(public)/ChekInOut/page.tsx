'use client';

import { useRef, useState } from 'react';

// ✅ CUSTOM BUTTON COMPONENT
function CrayonButton({ children, onClick, disabled = false, variant = 'primary' }:any) {
  const base = 'w-full py-3 rounded-xl font-semibold transition-all duration-200';
  const styles =
    variant === 'outline'
      ? 'border border-gray-300 text-gray-700 hover:bg-gray-100'
      : 'bg-black text-white hover:bg-gray-800';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

// ✅ CUSTOM CARD COMPONENT
function CrayonCard({ children }:any) {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100">
      {children}
    </div>
  );
}

function CrayonCardContent({ children }:any) {
  return <div className="p-6 space-y-6">{children}</div>;
}

export default function CheckInOutPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [locationAllowed, setLocationAllowed] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [faceScanned, setFaceScanned] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [status, setStatus] = useState('Waiting for verification...');

  // ----------------------
  // LOCATION VERIFICATION
  // ----------------------
  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationAllowed(true);
        setStatus('Location verified ✅');
      },
      () => {
        setStatus('Location permission denied ❌');
      }
    );
  };

  // ----------------------
  // CAMERA VERIFICATION
  // ----------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraAllowed(true);
        setStatus('Camera active ✅');
      }
    } catch {
      setStatus('Camera permission denied ❌');
    }
  };

  // ----------------------
  // FACE SCAN (DUMMY)
  // ----------------------
  const scanFace = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 300, 200);

    setFaceScanned(true);
    setStatus('Face scanned successfully ✅');
  };

  // ----------------------
  // CHECK IN & CHECK OUT
  // ----------------------
  const handleCheckIn = () => {
    if (!locationAllowed || !cameraAllowed || !faceScanned) {
      setStatus('Complete all verification steps first ❌');
      return;
    }
    setCheckedIn(true);
    setStatus('Checked In successfully ✅');
  };

  const handleCheckOut = () => {
    if (!checkedIn) {
      setStatus('You must check in first ❌');
      return;
    }
    setCheckedIn(false);
    setFaceScanned(false);
    setStatus('Checked Out successfully ✅');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <CrayonCard>
        <CrayonCardContent>
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Face Attendance System
          </h1>

          <p className="text-center text-sm text-gray-500">{status}</p>

          {/* CAMERA PREVIEW */}
          <div className="relative w-full h-52 bg-gray-100 rounded-xl overflow-hidden border">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} width={300} height={200} className="hidden" />
          </div>

          {/* VERIFICATION BUTTONS */}
          <div className="grid grid-cols-1 gap-3">
            <CrayonButton onClick={verifyLocation} variant="outline">
              Verify Location
            </CrayonButton>
            <CrayonButton onClick={startCamera} variant="outline">
              Enable Camera
            </CrayonButton>
            <CrayonButton onClick={scanFace} variant="outline">
              Scan Face
            </CrayonButton>
          </div>

          {/* CHECK IN / CHECK OUT */}
          <div className="flex gap-4 pt-4">
            <CrayonButton onClick={handleCheckIn} disabled={checkedIn}>
              Check In
            </CrayonButton>
            <CrayonButton onClick={handleCheckOut} variant="outline">
              Check Out
            </CrayonButton>
          </div>

          <div className="text-xs text-gray-400 text-center">
            Location → Camera → Face Scan → Check In → Check Out
          </div>
        </CrayonCardContent>
      </CrayonCard>
    </div>
  );
}
