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
  Camera
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";
import { attendanceService, type AttendanceLog } from "@/services/attendance.service";
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
  cyan: {
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    text: "text-cyan-700",
    button: "bg-cyan-600 hover:bg-cyan-700",
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    text: "text-indigo-700",
    button: "bg-indigo-600 hover:bg-indigo-700",
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
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
  if (s === "LEAVE_APPROVED" || s === "LEAVE") 
    return { bg: "bg-indigo-100", text: "text-indigo-700", label: "Leave" };
  return { bg: "bg-slate-100", text: "text-slate-700", label: status || "—" };
}

type AttendanceHubProps = {
  roleLabel?: string;
  accent?: "teal" | "cyan" | "indigo" | "amber";
  userId?: string;
  hideMarkButton?: boolean;
  pageSize?: number;
};

export default function AttendanceHub({ 
  roleLabel = "Attendance", 
  accent = "teal", 
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
  const [marking, setMarking] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultMsg, setResultMsg] = useState<string>("");
  const [resultType, setResultType] = useState<"success" | "error">("success");
  
  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();
  const { videoRef, startCamera, stopCamera, captureImage, capturing, error: cameraError } = useCameraCapture();
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [markType, setMarkType] = useState<'checkin' | 'checkout' | null>(null);
  
  const theme = accentMap[accent];

  // Format date helpers
  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        weekday: "short", 
        day: "numeric", 
        month: "short" 
      });
    } catch {
      return "Invalid date";
    }
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

  // Find today's log
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(log => {
    const logDate = log.attendanceDate ? new Date(log.attendanceDate).toISOString().split('T')[0] : null;
    return logDate === todayStr;
  });
  
  const alreadyCheckedIn = !!(todayLog?.checkIn?.time);
  const alreadyCheckedOut = !!(todayLog?.checkOut?.time);

  // Fetch logs with proper error handling
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
      
      console.log("API Response:", response);
      
      // Based on your API response structure:
      // {
      //   success: true,
      //   message: "Attendance logs fetched successfully",
      //   overview: { ... },
      //   pagination: { ... },
      //   logs: [ ... ]
      // }
      
      if (response?.success) {
        setLogs(response.logs || []);
        setOverview(response.overview || null);
        setPagination(response.pagination || null);
      } else {
        setError(response?.message || "Failed to load attendance logs");
        setLogs([]);
      }
      
    } catch (err) {
      console.error("Fetch logs error:", err);
      setError(getApiErrorMessage(err, "Failed to load attendance logs"));
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, user, pageSize]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(page);
  };

  const handleMarkAttendance = async (type: 'checkin' | 'checkout') => {
    try {
      setError(null);
      setMarkType(type);
      setMarking(true);
      
      await getLocation();
      setCameraOpen(true);
      startCamera();
    } catch (err) {
      setError("Failed to get location. Please enable location services.");
    } finally {
      setMarking(false);
    }
  };

  const handleCaptureAndVerify = async () => {
    try {
      setError(null);
      setMarking(true);
      
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
      
      console.log("Mark response:", response);
      
      if (response?.success) {
        setResultType("success");
        setResultMsg(response.message || `${markType === 'checkin' ? 'Check-in' : 'Check-out'} successful!`);
        setShowResult(true);
        
        // Close camera and refresh logs
        setCameraOpen(false);
        stopCamera();
        await fetchLogs(1); // Reset to first page
        setPage(1);
      } else {
        throw new Error(response?.message || "Failed to mark attendance");
      }
      
    } catch (err: any) {
      console.error("Verification error:", err);
      setResultType("error");
      setResultMsg(err?.message || "Face verification failed");
      setShowResult(true);
    } finally {
      setMarking(false);
      setMarkType(null);
    }
  };

  const handleCloseCamera = () => {
    setCameraOpen(false);
    stopCamera();
    setMarkType(null);
  };

  const today = new Date();
  const monthYear = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-w-0 max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <header className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
        <div className={`h-1.5 ${theme.dot}`} />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                {roleLabel} · Attendance
              </h1>
              <p className="text-slate-500 text-sm mt-1">{user?.name || "User"}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${theme.border} ${theme.bg}`}>
              <Calendar className={`w-5 h-5 ${theme.text}`} />
              <span className={`text-sm font-semibold ${theme.text}`}>{monthYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-slate-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>Today · {formatDisplayDate(today.toISOString())}</span>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mark attendance card */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scan className="w-5 h-5 text-amber-600" />
              Mark Today's Attendance
            </h2>
            <p className="text-sm text-slate-500">
              Face verification required. Please ensure you're in a well-lit area.
            </p>
            
            {location && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                <MapPin className="w-3 h-3" />
                <span>Location captured</span>
              </div>
            )}
            
            {!hideMarkButton && (
              <div className="space-y-3">
                {!alreadyCheckedIn && (
                  <button
                    type="button"
                    onClick={() => handleMarkAttendance('checkin')}
                    disabled={marking || geoLoading}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:shadow-xl ${theme.button} disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto`}
                  >
                    {marking || geoLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    {marking || geoLoading ? "Checking Location..." : "Check In with Face"}
                  </button>
                )}
                
                {alreadyCheckedIn && !alreadyCheckedOut && (
                  <button
                    type="button"
                    onClick={() => handleMarkAttendance('checkout')}
                    disabled={marking || geoLoading}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:shadow-xl ${theme.button} disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto`}
                  >
                    {marking || geoLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    {marking || geoLoading ? "Checking Location..." : "Check Out with Face"}
                  </button>
                )}
                
                {alreadyCheckedIn && alreadyCheckedOut && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Attendance completed for today</span>
                  </div>
                )}
              </div>
            )}
            
            {geoError && (
              <div className="text-red-500 text-xs flex items-center gap-1 mt-2">
                <XCircle className="w-3 h-3" />
                {geoError}
              </div>
            )}
          </div>
          
          {/* Profile Image */}
          <div className="w-44 h-44 rounded-full border-4 border-amber-200 bg-amber-50 flex items-center justify-center overflow-hidden">
            {todayLog?.checkIn?.image?.url ? (
              <img 
                src={todayLog.checkIn.image.url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-20 h-20 text-amber-300" />
            )}
          </div>
        </div>
      </section>

      {/* Camera Modal */}
      <Modal open={cameraOpen} onClose={handleCloseCamera}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {markType === 'checkin' ? 'Check In' : 'Check Out'} - Face Verification
          </h3>
          
          <div className="relative flex justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-64 h-64 rounded-full border-4 border-amber-400 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 rounded-full border-2 border-amber-500 opacity-50" />
            </div>
          </div>
          
          {cameraError && (
            <p className="text-red-500 text-sm text-center mt-4">{cameraError}</p>
          )}
          
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={handleCloseCamera}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCaptureAndVerify}
              disabled={capturing || !location}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {capturing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {capturing ? "Capturing..." : "Capture & Verify"}
            </button>
          </div>
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
          <p className="text-lg font-medium text-slate-900 mb-2">
            {resultType === 'success' ? 'Success!' : 'Error'}
          </p>
          <p className="text-slate-600 mb-6">{resultMsg}</p>
          <button
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            onClick={() => setShowResult(false)}
          >
            OK
          </button>
        </div>
      </Modal>

      {/* Month stats from API overview */}
      {overview && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-slate-500">This month</span>
            {overview.totalDays > 0 && (
              <span className="text-sm font-semibold text-emerald-600">
                {Math.round(((overview.presentFull + overview.presentHalf) / overview.totalDays) * 100)}% attendance
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Days</p>
              <p className="text-2xl font-bold text-slate-900">{overview.totalDays || 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Present</p>
              <p className="text-2xl font-bold text-emerald-600">{(overview.presentFull || 0) + (overview.presentHalf || 0)}</p>
              <p className="text-xs text-slate-400">Full: {overview.presentFull || 0} | Half: {overview.presentHalf || 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Absent</p>
              <p className="text-2xl font-bold text-red-600">{overview.absent || 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-slate-900">{overview.totalHours || 0}h</p>
              <p className="text-xs text-slate-400">Late: {overview.lateMinutes || 0}min</p>
            </div>
          </div>
        </section>
      )}

      {/* Recent logs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Logs</h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 flex items-center gap-1"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
            <p className="text-slate-400 text-sm mt-1">Mark your first attendance using face verification above.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {logs.map((log) => {
                const dateStr = log.attendanceDate;
                const checkInTime = log.checkIn?.time;
                const checkOutTime = log.checkOut?.time;
                const status = log.status || "UNKNOWN";
                const style = getStatusStyle(status);
                
                return (
                  <div
                    key={log._id}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-slate-500">
                          {dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short" }) : "—"}
                        </span>
                        <span className="text-lg font-bold text-slate-900 leading-none">
                          {dateStr ? new Date(dateStr).getDate() : "—"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {dateStr ? new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" }) : "Unknown date"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDisplayTime(checkInTime)} – {formatDisplayTime(checkOutTime)}
                        </p>
                        {log.totalHours > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            Total: {log.totalHours} hrs {log.lateByMinutes > 0 && `• Late: ${log.lateByMinutes}min`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  className="px-3 py-1 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-50 hover:bg-slate-200 transition-colors"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="px-3 py-1 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-50 hover:bg-slate-200 transition-colors"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}