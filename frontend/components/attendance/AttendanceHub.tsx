"use client";

import { useCallback, useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCameraCapture } from "@/hooks/useCameraCapture";
import Modal from "../Modal";
import {
  Calendar,
  Scan,
  Clock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Camera,
  RefreshCw
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";
import { attendanceService } from "@/services/attendance.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

const accentMap = {
  teal: {
    bg: "bg-teal-50",
    border: "border-teal-100",
    text: "text-teal-700",
    button: "bg-teal-600 hover:bg-teal-700",
    badge: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
    button: "bg-amber-600 hover:bg-amber-700",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
};

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  const s = (status || "").toUpperCase();
  if (s === "PRESENT_FULL" || s === "WORKING") 
    return { bg: "bg-emerald-100", text: "text-emerald-700", label: "Present" };
  if (s === "PRESENT_HALF") 
    return { bg: "bg-amber-100", text: "text-amber-700", label: "Half Day" };
  if (s === "ABSENT") 
    return { bg: "bg-red-100", text: "text-red-700", label: "Absent" };
  return { bg: "bg-slate-100", text: "text-slate-700", label: status || "—" };
}

type AttendanceHubProps = {
  roleLabel?: string;
  accent?: "teal" | "amber";
  userId?: string;
  hideMarkButton?: boolean;
  pageSize?: number;
};

export default function AttendanceHub({ 
  roleLabel = "Attendance", 
  accent = "amber", 
  userId, 
  hideMarkButton, 
  pageSize = 10 
}: AttendanceHubProps) {
  const { user } = useAuthContext();
  const [logs, setLogs] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultMsg, setResultMsg] = useState<string>("");
  const [resultType, setResultType] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();
  const { videoRef, startCamera, stopCamera, captureImage, isCameraReady, error: cameraError } = useCameraCapture();
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [markType, setMarkType] = useState<'checkin' | 'checkout' | null>(null);
  
  const theme = accentMap[accent];

  // Find today's log
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(log => {
    const logDate = log.attendanceDate ? new Date(log.attendanceDate).toISOString().split('T')[0] : null;
    return logDate === todayStr;
  });
  
  const alreadyCheckedIn = !!(todayLog?.checkIn?.time);
  const alreadyCheckedOut = !!(todayLog?.checkOut?.time);

  // Fetch logs
  const fetchLogs = useCallback(async (pageNum = 1) => {
    try {
      setError(null);
      setLoading(true);
      
      const id = userId || user?.id || user?._id;
      if (!id) throw new Error("No user ID available");
      
      const response = await attendanceService.getMyLogs({ 
        page: pageNum, 
        limit: pageSize 
      });
      
      if (response?.success) {
        setLogs(response.logs || []);
        setOverview(response.overview || null);
        setPagination(response.pagination || null);
      }
      
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load attendance logs"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, user, pageSize]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const handleMarkAttendance = async (type: 'checkin' | 'checkout') => {
    try {
      setError(null);
      setMarkType(type);
      
      // Get location first
      await getLocation();
      
      // Then open camera
      setCameraOpen(true);
      
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        startCamera();
      }, 300);
      
    } catch (err) {
      setError("Failed to get location. Please enable location services.");
    }
  };

  const handleCaptureAndSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!location) throw new Error("Location not available");
      
      const imageDataUrl = await captureImage();
      if (!imageDataUrl) throw new Error("Failed to capture image");
      
      let response;
      if (markType === 'checkin') {
        response = await attendanceService.checkInFace({ 
          lat: location.lat, 
          lng: location.lng, 
          imageUrl: imageDataUrl 
        });
      } else {
        response = await attendanceService.checkOutFace({ 
          lat: location.lat, 
          lng: location.lng, 
          imageUrl: imageDataUrl 
        });
      }
      
      if (response?.success) {
        setResultType("success");
        setResultMsg(response.message || `${markType === 'checkin' ? 'Check-in' : 'Check-out'} successful!`);
        setShowResult(true);
        
        // Close camera and refresh
        handleCloseCamera();
        await fetchLogs(1);
        setPage(1);
      } else {
        throw new Error(response?.message || "Failed to mark attendance");
      }
      
    } catch (err: any) {
      console.error("Submission error:", err);
      setResultType("error");
      setResultMsg(err?.message || "Verification failed");
      setShowResult(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCamera = () => {
    setCameraOpen(false);
    stopCamera();
    setMarkType(null);
  };

  const formatDisplayTime = (timeString: string | undefined) => {
    if (!timeString) return "—";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="min-w-0 max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <header className="rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className={`h-1.5 ${theme.dot}`} />
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {roleLabel} · Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-1">{user?.name || "User"}</p>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Mark attendance card */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Scan className="w-5 h-5 text-amber-600" />
              Mark Today's Attendance
            </h2>
            
            {location && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit mb-4">
                <MapPin className="w-3 h-3" />
                <span>Location captured ✓</span>
              </div>
            )}
            
            {!hideMarkButton && (
              <div className="space-y-3">
                {!alreadyCheckedIn && (
                  <button
                    onClick={() => handleMarkAttendance('checkin')}
                    disabled={geoLoading}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg ${theme.button} disabled:opacity-50`}
                  >
                    {geoLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    {geoLoading ? "Getting Location..." : "Check In with Face"}
                  </button>
                )}
                
                {alreadyCheckedIn && !alreadyCheckedOut && (
                  <button
                    onClick={() => handleMarkAttendance('checkout')}
                    disabled={geoLoading}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg ${theme.button} disabled:opacity-50`}
                  >
                    {geoLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    {geoLoading ? "Getting Location..." : "Check Out with Face"}
                  </button>
                )}
                
                {alreadyCheckedIn && alreadyCheckedOut && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Attendance completed for today</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Profile Image */}
          <div className="w-32 h-32 rounded-full border-4 border-amber-200 bg-amber-50 flex items-center justify-center overflow-hidden">
            {todayLog?.checkIn?.image?.url ? (
              <img src={todayLog.checkIn.image.url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-amber-300" />
            )}
          </div>
        </div>
      </section>

      {/* Camera Modal - SIMPLIFIED */}
      {/* Camera Modal - FAST LOADING */}
<Modal open={cameraOpen} onClose={handleCloseCamera}>
  <div className="p-6">
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      {markType === 'checkin' ? 'Check In' : 'Check Out'}
    </h3>
    
    <div className="flex justify-center">
      {cameraError ? (
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{cameraError}</p>
          <button
            onClick={handleCloseCamera}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Always show video element, even if not ready */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`w-64 h-64 rounded-full border-4 border-amber-400 object-cover transition-opacity duration-300 ${
              isCameraReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Show loading overlay only when not ready */}
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-50 rounded-full border-4 border-amber-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          )}
        </div>
      )}
    </div>
    
    {isCameraReady && !cameraError && (
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleCloseCamera}
          className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={handleCaptureAndSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {isSubmitting ? "Submitting..." : "Capture & Submit"}
        </button>
      </div>
    )}
    
    {/* Add a quick retry button if taking too long */}
    {!isCameraReady && !cameraError && (
      <div className="text-center mt-4">
        <button
          onClick={() => {
            stopCamera();
            setTimeout(() => startCamera(), 100);
          }}
          className="text-xs text-amber-600 hover:text-amber-700"
        >
          Camera stuck? Click to retry
        </button>
      </div>
    )}
  </div>
</Modal>

      {/* Result Modal */}
      <Modal open={showResult} onClose={() => setShowResult(false)}>
        <div className="p-6 text-center">
          <div className={`mb-4 ${resultType === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {resultType === 'success' ? (
              <CheckCircle className="w-12 h-12 mx-auto" />
            ) : (
              <XCircle className="w-12 h-12 mx-auto" />
            )}
          </div>
          <p className="text-slate-600 mb-6">{resultMsg}</p>
          <button
            className="px-6 py-2 bg-amber-600 text-white rounded-lg"
            onClick={() => setShowResult(false)}
          >
            OK
          </button>
        </div>
      </Modal>

      {/* Month stats */}
      {overview && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">This Month</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Present</p>
              <p className="text-2xl font-bold text-emerald-600">
                {(overview.presentFull || 0) + (overview.presentHalf || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Absent</p>
              <p className="text-2xl font-bold text-red-600">{overview.absent || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Hours</p>
              <p className="text-2xl font-bold text-slate-900">{overview.totalHours || 0}h</p>
            </div>
          </div>
        </section>
      )}

      {/* Recent logs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Logs</h2>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchLogs(page);
            }}
            disabled={refreshing}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 flex items-center gap-1"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No attendance records found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {logs.slice(0, 5).map((log) => {
                const style = getStatusStyle(log.status);
                
                return (
                  <div
                    key={log._id}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {log.attendanceDate ? new Date(log.attendanceDate).toLocaleDateString() : "Unknown"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDisplayTime(log.checkIn?.time)} – {formatDisplayTime(log.checkOut?.time)}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}