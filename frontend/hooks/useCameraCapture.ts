import { useRef, useState } from "react";

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const startCamera = async () => {
    setError(null);
    setCapturing(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err: any) {
      setError(err.message || "Failed to access camera");
      setCapturing(false);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCapturing(false);
  };

  const captureImage = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(null);
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg"));
    });
  };

  return { videoRef, startCamera, stopCamera, captureImage, capturing, error };
}
