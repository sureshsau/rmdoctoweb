"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Clock,
  MapPin,
  Save,
  Calendar,
  ArrowLeft,
  Scan,
  Camera,
  X,
} from "lucide-react";
import Link from "next/link";
import { attendanceService } from "@/services/attendance.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import toast from "react-hot-toast";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_SLOTS = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
  "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
];

export default function UserAttendanceSettingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const name = searchParams?.get("name") || "Employee";
  const role = searchParams?.get("role") || "—";
  const phone = searchParams?.get("phone") || "N/A";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [shiftStartTime, setShiftStartTime] = useState("09:00");
  const [shiftEndTime, setShiftEndTime] = useState("17:00");
  const [requiredHoursPerDay, setRequiredHoursPerDay] = useState("8");
  const [halfDayMinHours, setHalfDayMinHours] = useState("4");
  const [graceMinutes, setGraceMinutes] = useState("10");
  const [weeklyOffDays, setWeeklyOffDays] = useState<string[]>(["Sunday"]);
  const [allowedLocation, setAllowedLocation] = useState({
    lat: 28.6139,
    lng: 77.209,
    radiusMeters: 50,
  });

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingType, setEditingType] = useState<"start" | "end" | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg);
      toast.error("Could not access camera. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setShowCamera(false);
    setCameraReady(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "face.jpg", { type: "image/jpeg" });
        setFaceFile(file);
        setFacePreview(canvas.toDataURL("image/jpeg"));
        stopCamera();
        toast.success("Photo captured");
      },
      "image/jpeg",
      0.92
    );
  };

  const fetchLocation = () => {
    setFetchingLocation(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setFetchingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAllowedLocation((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        toast.success("Location updated");
        setFetchingLocation(false);
      },
      () => {
        toast.error("Failed to get location");
        setFetchingLocation(false);
      }
    );
  };

  const toggleWeekOff = (day: string) => {
    setWeeklyOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faceFile) {
      toast.error("Please upload a face image first");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("shiftStartTime", shiftStartTime);
      formData.append("shiftEndTime", shiftEndTime);
      formData.append("requiredHoursPerDay", requiredHoursPerDay);
      formData.append("halfDayMinHours", halfDayMinHours);
      formData.append("graceMinutes", graceMinutes);
      formData.append("weeklyOffDays", JSON.stringify(weeklyOffDays));
      formData.append("allowedLocation", JSON.stringify(allowedLocation));
      formData.append("faceImage", faceFile);

      await attendanceService.setupUserAttendance(id, formData);
      toast.success("Attendance setup saved");
      router.push("/admin/users");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openTimeModal = (type: "start" | "end") => {
    setEditingType(type);
    setShowTimeModal(true);
  };

  const selectTime = (time: string) => {
    if (editingType === "start") setShiftStartTime(time);
    else if (editingType === "end") setShiftEndTime(time);
    setShowTimeModal(false);
    setEditingType(null);
  };

  const avatarUrl = facePreview
    ? facePreview
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  return (
    <div className="min-h-screen bg-gray-50/80 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-cyan-600 font-bold text-sm mb-6 hover:text-cyan-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>

        <h1 className="text-2xl font-black text-gray-900 mb-2">
          Attendance Setting
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Configure shift, rules, and location for this user.
        </p>

        {/* User card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 mb-8">
          <img
            src={avatarUrl}
            alt={name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
          />
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 truncate">{name}</p>
            <p className="text-sm text-gray-500">{role}</p>
            <p className="text-sm text-gray-500">{phone}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Face */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
              Face Registration
            </h2>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-cyan-500 flex items-center justify-center overflow-hidden bg-gray-50">
                {facePreview ? (
                  <img
                    src={facePreview}
                    alt="Face"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Scan className="w-12 h-12 text-cyan-400" />
                )}
              </div>
              <p className="mt-3 text-sm font-bold text-gray-600">
                {faceFile ? "Photo captured" : "Take a photo using camera"}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl font-bold text-sm hover:bg-cyan-700 transition"
              >
                <Camera className="w-4 h-4" />
                {faceFile ? "Retake photo" : "Open camera"}
              </button>
            </div>
          </section>

          {/* Camera modal */}
          {showCamera && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                  <h3 className="font-black text-gray-900">Capture face</h3>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative bg-black aspect-[4/3]">
                  {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      <p className="text-red-500 font-medium">{cameraError}</p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </>
                  )}
                </div>
                <div className="p-4 flex gap-3">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Capture
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Shift */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Shift Timing
            </h2>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-0">
              <button
                type="button"
                onClick={() => openTimeModal("start")}
                className="w-full flex justify-between items-center py-4 border-b border-gray-100"
              >
                <span className="font-bold text-gray-700">Start Time</span>
                <span className="font-black text-gray-900">{shiftStartTime}</span>
              </button>
              <button
                type="button"
                onClick={() => openTimeModal("end")}
                className="w-full flex justify-between items-center py-4"
              >
                <span className="font-bold text-gray-700">End Time</span>
                <span className="font-black text-gray-900">{shiftEndTime}</span>
              </button>
            </div>
          </section>

          {/* Rules */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
              Attendance Rules
            </h2>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-700">Required Hrs / Day</label>
                <input
                  type="number"
                  min="1"
                  value={requiredHoursPerDay}
                  onChange={(e) => setRequiredHoursPerDay(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-center font-bold"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-700">Half Day Min Hrs</label>
                <input
                  type="number"
                  min="1"
                  value={halfDayMinHours}
                  onChange={(e) => setHalfDayMinHours(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-center font-bold"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-700">Grace Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-center font-bold"
                />
              </div>
            </div>
          </section>

          {/* Weekly off */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Weekly Off Days
            </h2>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const selected = weeklyOffDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekOff(day)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                      selected
                        ? "bg-cyan-600 text-white border-cyan-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Location */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Allowed Location
            </h2>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <p className="text-sm text-gray-600">
                Lat: {allowedLocation.lat.toFixed(6)} · Lng: {allowedLocation.lng.toFixed(6)}
              </p>
              <p className="text-sm text-gray-600">
                Radius: {allowedLocation.radiusMeters} m
              </p>
              <button
                type="button"
                onClick={fetchLocation}
                disabled={fetchingLocation}
                className="w-full py-3 rounded-xl border-2 border-cyan-500 text-cyan-600 font-bold hover:bg-cyan-50 transition disabled:opacity-50"
              >
                {fetchingLocation ? "Fetching…" : "Use current location"}
              </button>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Lat</label>
                  <input
                    type="number"
                    step="any"
                    value={allowedLocation.lat}
                    onChange={(e) =>
                      setAllowedLocation((prev) => ({
                        ...prev,
                        lat: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Lng</label>
                  <input
                    type="number"
                    step="any"
                    value={allowedLocation.lng}
                    onChange={(e) =>
                      setAllowedLocation((prev) => ({
                        ...prev,
                        lng: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Radius (m)</label>
                  <input
                    type="number"
                    min="1"
                    value={allowedLocation.radiusMeters}
                    onChange={(e) =>
                      setAllowedLocation((prev) => ({
                        ...prev,
                        radiusMeters: parseInt(e.target.value, 10) || 50,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving || !faceFile}
            className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-black text-sm hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving…" : "Save Attendance Setup"}
          </button>
        </form>
      </div>

      {/* Time picker modal */}
      {showTimeModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTimeModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="p-4 font-black text-gray-900 text-center border-b">
              Select {editingType === "start" ? "Start" : "End"} Time
            </p>
            <div className="max-h-72 overflow-y-auto">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => selectTime(time)}
                  className="w-full py-3 text-center font-semibold text-gray-800 hover:bg-cyan-50 border-b border-gray-50 last:border-0"
                >
                  {time}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTimeModal(false)}
              className="w-full py-3 bg-gray-100 font-bold text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
