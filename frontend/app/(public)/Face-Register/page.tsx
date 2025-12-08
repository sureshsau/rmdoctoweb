'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { generateFaceVector } from '@/lib/face';

const CRAYON_BLUE = '#4C9FFF';

export default function RegisterFacePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [vector, setVector] = useState<number[] | null>(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 🎥 INIT CAMERA
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

  // ✅ ONE CLICK AUTO PIPELINE (CAPTURE → VECTOR → REGISTER)
  const handleAutoCaptureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setIsCapturing(true);
      setIsGenerating(false);
      setIsSubmitting(false);
      setError('');
      setSuccessMessage('');

      // ✅ STEP 1: CAPTURE IMAGE
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);

      setIsCapturing(false);
      setIsGenerating(true);

      // ✅ STEP 2: GENERATE FACE VECTOR
      const faceVector: number[] = await generateFaceVector(dataUrl);
      setVector(faceVector);

      setIsGenerating(false);
      setIsSubmitting(true);

      // ✅ STEP 3: AUTO REGISTER TO BACKEND
      const res = await fetch('/api/face/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceVector,
          snapshot: dataUrl,
        }),
      });

      if (!res.ok) throw new Error('Registration failed');

      setSuccessMessage('✅ Face captured & registered successfully!');
    } catch (err) {
      console.error(err);
      setError('❌ Face registration failed. Try again.');
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-3xl shadow-xl border border-slate-100 flex overflow-hidden">

        {/* LEFT SIDE */}
        <div
          className="w-2/5 p-8 text-white"
          style={{ background: `linear-gradient(135deg, ${CRAYON_BLUE}, #90C2FF)` }}
        >
          <h1 className="text-3xl font-bold mb-3">Register Face</h1>
          <p className="text-white/90 text-sm">
            One-click secure face capture & registration system.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-3/5 p-6 bg-slate-50 flex flex-col gap-4">

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

          {/* CAMERA / PREVIEW */}
          <div className="relative rounded-xl overflow-hidden bg-black h-64">
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

          {/* ✅ ONE CLICK BUTTON */}
          <div className="flex gap-3 flex-wrap">
            {!capturedImage ? (
              <button
                onClick={handleAutoCaptureAndRegister}
                disabled={!isCameraReady || isCapturing || isGenerating || isSubmitting}
                className="px-5 py-2 rounded-full text-white flex items-center gap-2"
                style={{ backgroundColor: CRAYON_BLUE }}
              >
                {(isCapturing || isGenerating || isSubmitting) ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isCapturing && 'Capturing...'}
                    {isGenerating && 'Processing Face...'}
                    {isSubmitting && 'Registering...'}
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    Capture & Register
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleRetake}
                className="px-4 py-2 border rounded-full flex items-center gap-2"
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
