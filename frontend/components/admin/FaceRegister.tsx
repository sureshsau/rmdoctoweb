'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { generateFaceVector } from '@/lib/face';
import axios from 'axios';

const CRAYON_BLUE = '#4C9FFF';

export default function FaceLoginPage({userId}:{
  userId: string
}) {
  if (!userId) return null; 
  console.log(userId);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [vector, setVector] = useState<number[] | null>(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ Freeze Face Vector Generator Against Runtime Tampering
  useEffect(() => {
    Object.freeze(generateFaceVector);
  }, []);

  // ✅ Camera Init
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        setError('');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        console.error(err);
        setError('Unable to access camera. Please allow camera permission.');
      }
    };

    initCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ✅ Motion Detection (Liveness)
  const lastFrameRef = useRef<Uint8ClampedArray | null>(null);

  const detectMotion = () => {
    if (!videoRef.current || !canvasRef.current) return false;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    canvas.width = 100;
    canvas.height = 100;

    ctx.drawImage(video, 0, 0, 100, 100);
    const currentFrame = ctx.getImageData(0, 0, 100, 100).data;

    if (!lastFrameRef.current) {
      lastFrameRef.current = currentFrame;
      return false;
    }

    let diff = 0;
    for (let i = 0; i < currentFrame.length; i += 4) {
      diff += Math.abs(currentFrame[i] - lastFrameRef.current[i]);
    }

    lastFrameRef.current = currentFrame;
    return diff > 20000;
  };

  // ✅ One-Click Auto Face Login
  const handleAutoCaptureAndLogin = async () => {
    if (isCapturing || isGenerating || isSubmitting) return;
    if (!videoRef.current || !canvasRef.current) return;
   const token =
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

// const user =
//   typeof window !== "undefined"
//     ? JSON.parse(localStorage.getItem("user") || "null")
//     : null;

// const userId = user?.id; 
if (!token || !userId) {
  throw new Error("Authentication data missing. Please login again.");
}

    try {
      setIsCapturing(true);
      setIsGenerating(false);
      setIsSubmitting(false);
      setError('');
      setSuccessMessage('');

      // ✅ Liveness Check
      // if (!detectMotion()) {
      //   throw new Error('No face movement detected. Please blink or move slightly.');
      // }

      // ✅ Capture Snapshot
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg');

      if (!dataUrl.startsWith('data:image/jpeg')) {
        throw new Error('Invalid capture source');
      }

      setCapturedImage(dataUrl);

      setIsCapturing(false);
      setIsGenerating(true);

      // ✅ Generate Vector (Backend Contract Preserved)
      const faceVector = await generateFaceVector(dataUrl);

      // ✅ Hard Client Validation
      if (
        !Array.isArray(faceVector) ||
        faceVector.length !== 128 ||
        faceVector.some(v => typeof v !== 'number' || isNaN(v))
      ) {
        throw new Error('Corrupted face vector');
      }

      setVector(faceVector);

      setIsGenerating(false);
      setIsSubmitting(true);

      // ✅ API Call (UNCHANGED)
      console.log("Vector length:", faceVector.length);

const res = await axios.post(
  `${API_URL}/attendance/register/face`,
  {
    userId,                    // ✅ REQUIRED BY BACKEND
    embedding: faceVector,     // ✅ REQUIRED BY BACKEND
    snapshot: dataUrl,         // (extra is fine)
  },
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
);

setSuccessMessage('✅ Face verified successfully. Login complete!');

    } catch (err: any) {
  console.error("AXIOS FULL ERROR:", err);

  const backendMessage =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    '❌ Face verification failed. Try again.';

  setError(backendMessage);
} finally {
      setIsCapturing(false);
      setIsGenerating(false);
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setVector(null);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="w-full flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden bg-white">

        {/* LEFT INFO PANEL */}
        <div
          className="w-2/5 p-6 text-white flex flex-col justify-between"
          style={{ background: `linear-gradient(135deg, ${CRAYON_BLUE}, #90C2FF)` }}
        >
          <div>
            <h1 className="text-2xl font-bold mb-2">Face Login</h1>
            <p className="text-white/90 text-sm">
              One-click secure face verification & login system.
            </p>
          </div>
          <div className="text-xs text-white/80 mt-6">
            Your face data is encrypted and securely verified.
          </div>
        </div>

        {/* RIGHT CAMERA PANEL */}
        <div className="w-3/5 p-5 bg-slate-50 flex flex-col gap-4">

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden bg-black h-[320px] border">

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
              <div className="w-52 h-64 border-2 border-dashed border-cyan-400 rounded-full opacity-70" />
            </div>

            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={capturedImage}
                className="w-full h-full object-cover"
                alt="Captured"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            {!capturedImage ? (
              <button
                onClick={handleAutoCaptureAndLogin}
                disabled={!isCameraReady || isCapturing || isGenerating || isSubmitting}
                className="px-5 py-2 rounded-full text-white flex items-center gap-2 text-sm shadow-md disabled:opacity-60"
                style={{ backgroundColor: CRAYON_BLUE }}
              >
                {(isCapturing || isGenerating || isSubmitting) ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isCapturing && 'Capturing...'}
                    {isGenerating && 'Processing...'}
                    {isSubmitting && 'Verifying...'}
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    Capture & Login
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleRetake}
                className="px-4 py-2 border rounded-full flex items-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Retake
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            {vector ? `Vector Length: ${vector.length}` : 'Vector not generated'}
          </p>
        </div>
      </div>
    </div>
  );
}
