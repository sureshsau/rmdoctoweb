'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { generateFaceVector } from '@/lib/face';

/* ----------------------------------
   Toast Component (Popup)
---------------------------------- */
function Toast({
  type,
  message,
  onClose,
}: {
  type: 'error' | 'success';
  message: string;
  onClose: () => void;
}) {
  const styles =
    type === 'error'
      ? 'bg-red-600'
      : 'bg-green-600';

  return (
    <div className={`fixed top-6 right-6 z-50 ${styles} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm`}>
      <div className="flex items-start gap-3">
        {type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        <p className="text-sm leading-snug">{message}</p>
        <button onClick={onClose} className="ml-auto">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------
   Error Mapping (Backend → User)
---------------------------------- */
function mapCheckInError(err: any): string {
  const msg = err?.response?.data?.message || '';

  if (msg.includes('already checked in'))
    return 'You have already checked in today.';

  if (msg.includes('Face reference not registered'))
    return 'Face not registered. Please complete face setup first.';

  if (msg.includes('Attendance settings missing'))
    return 'Face setup missing. Please contact administrator.';

  if (msg.includes('Invalid face embedding'))
    return 'Face capture failed. Please try again.';

  if (err?.code === 'ERR_NETWORK')
    return 'Network issue. Please check your internet connection.';

  return 'Unable to check in right now. Please try again.';
}

/* ----------------------------------
   Main Component
---------------------------------- */
export default function FaceCheckInPage({ userId }: { userId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [cameraReady, setCameraReady] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  /* ---------------- Camera ---------------- */
  useEffect(() => {
    let stream: MediaStream | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
      } catch {
        setToast({ type: 'error', message: 'Camera permission denied.' });
      }
    })();

    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  /* ---------------- Location ---------------- */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }),
      () => setToast({ type: 'error', message: 'Location permission denied.' })
    );
  }, []);

  /* ---------------- Auto dismiss toast ---------------- */
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ---------------- Check-In Logic ---------------- */
  const handleCheckIn = async () => {
    if (!videoRef.current || !canvasRef.current || !coords) {
      setToast({ type: 'error', message: 'Camera or location not ready.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !userId) {
      setToast({ type: 'error', message: 'Session expired. Please login again.' });
      return;
    }

    try {
      setLoading(true);

      /* Capture image */
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageUrl = canvas.toDataURL('image/jpeg');

      /* Generate embedding */
      const faceEmbedding = await generateFaceVector(imageUrl);

      if (!Array.isArray(faceEmbedding) || faceEmbedding.length !== 128) {
        throw new Error('Invalid face vector');
      }

      /* Backend call (EXACT CONTRACT MATCH) */
      const res = await axios.post(
        `${API_URL}/attendance/checkIn/face`,
        {
          userId,
          faceEmbedding,
          lat: coords.lat,
          lng: coords.lng,
          deviceInfo: navigator.userAgent,
          imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { faceMatched, locationValid, confidence } = res.data;

      if (!faceMatched) {
        setToast({ type: 'error', message: 'Face does not match. Please try again.' });
        return;
      }

      if (!locationValid) {
        setToast({ type: 'error', message: 'You are outside the allowed location.' });
        return;
      }

      setToast({
        type: 'success',
        message: `Checked in successfully (confidence ${confidence})`,
      });
    } catch (err: any) {
      setToast({ type: 'error', message: mapCheckInError(err) });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-xl font-bold text-center">Face Check-In</h1>

        <div className="h-56 bg-black rounded overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <button
          onClick={handleCheckIn}
          disabled={!cameraReady || !coords || loading}
          className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-60"
        >
          {loading ? (
            <span className="flex justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Verifying…
            </span>
          ) : (
            <span className="flex justify-center gap-2">
              <Camera size={16} /> Check In
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
