// hooks/useCameraCapture.ts
import { useRef, useState, useCallback, useEffect } from "react";

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    console.log("Starting camera...");
    setError(null);
    setIsCameraReady(false);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser doesn't support camera");
      }

      // Request camera with minimal constraints for speed
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 320 }, // Lower resolution for faster startup
          height: { ideal: 320 }
        } 
      });
      
      setStream(s);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        
        // DON'T wait for any events - just try to play immediately
        try {
          await videoRef.current.play();
          console.log("Camera playing immediately");
          setIsCameraReady(true);
        } catch (playErr) {
          console.error("Play error:", playErr);
        }
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(err.message || "Failed to access camera");
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log("Stopping camera...");
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
    setError(null);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const captureImage = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null);
        return;
      }

      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 320;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        console.error("Capture error:", err);
        resolve(null);
      }
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return { 
    videoRef, 
    startCamera, 
    stopCamera, 
    captureImage, 
    isCameraReady,
    error 
  };
}