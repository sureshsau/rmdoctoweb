"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Scan,
  Clock,
  User,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuthContext } from "@/state/AuthContext";
import { attendanceService, type AttendanceLogEntry } from "@/services/attendance.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

type AttendanceHubProps = {
  /** Role label for header, e.g. "Admin", "Doctor", "Agent" */
  roleLabel?: string;
  /** Accent color class for buttons/badges, e.g. "teal", "cyan", "indigo" */
  accent?: "teal" | "cyan" | "indigo" | "amber";
  /** Optional userId for admin/manager view */
  userId?: string;
  /** Hide mark attendance button (for admin or readonly views) */
  hideMarkButton?: boolean;
};

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

function getLogDate(log: AttendanceLogEntry): string {
  return log.attendanceDate ?? log.date ?? "";
}

function getCheckInTime(log: AttendanceLogEntry): string {
  if (log.checkIn?.time) return log.checkIn.time;
  if (log.checkInTime) return log.checkInTime;
  return "";
}

function getCheckOutTime(log: AttendanceLogEntry): string {
  if (log.checkOut?.time) return log.checkOut.time;
  if (log.checkOutTime) return log.checkOutTime;
  return "";
}

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  const s = (status || "").toUpperCase();
  if (s === "PRESENT_FULL" || s === "WORKING") return { bg: "bg-emerald-100", text: "text-emerald-700", label: "Present" };
  if (s === "PRESENT_HALF") return { bg: "bg-amber-100", text: "text-amber-700", label: "Half Day" };
  if (s === "ABSENT") return { bg: "bg-red-100", text: "text-red-700", label: "Absent" };
  if (s === "LEAVE_APPROVED" || s === "LEAVE") return { bg: "bg-indigo-100", text: "text-indigo-700", label: "Leave" };
  return { bg: "bg-slate-100", text: "text-slate-700", label: status || "—" };
}

export default function AttendanceHub({ roleLabel = "Attendance", accent = "teal", userId, hideMarkButton }: AttendanceHubProps) {
  const { user } = useAuthContext();
  const [logs, setLogs] = useState<AttendanceLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [markSuccess, setMarkSuccess] = useState<string | null>(null);
  const theme = accentMap[accent];

  // UseAuthContext is already called above, do not redeclare 'user'.
  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      // Always pass a userId (self or other)
      const id = userId || user?.id || user?._id;
      if (!id) throw new Error("No userId available for attendance logs");
      const res = await attendanceService.getMyLogs(id);
      const data = res?.data ?? res;
      const list = Array.isArray(data?.logs) ? data.logs : Array.isArray(data) ? data : [];
      setLogs(list);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load attendance logs"));
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  // Simple mark attendance (no face verification)
  const handleMarkAttendance = async () => {
    setMarking(true);
    setMarkSuccess(null);
    setError(null);
    try {
      // For demo: just send current date, status present
      const formData = new FormData();
      formData.append("status", "PRESENT_FULL");
      if (userId) formData.append("userId", userId);
      // Optionally add more fields as needed
      await attendanceService.markAttendance(formData);
      setMarkSuccess("Attendance marked successfully!");
      fetchLogs();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to mark attendance"));
    } finally {
      setMarking(false);
    }
  };

  const today = new Date();
  const monthYear = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
  const formatTime = (t: string) =>
    t ? new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";

  // Derive month stats from logs
  const presentCount = logs.filter((l) => ["PRESENT_FULL", "WORKING", "PRESENT_HALF"].includes((l.status || "").toUpperCase())).length;
  const totalCount = logs.length;

  return (
    <div className="min-w-0 max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <header className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
        <div className={`h-1.5 ${theme.dot}`} />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Mark attendance</p>
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
            <span>Today · {formatDate(today.toISOString())}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Mark attendance card (no face verification) */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mark today's attendance</h2>
            <p className="text-slate-500 text-sm mt-1">Click below to mark yourself present for today.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-8">
          <div className="w-40 h-40 rounded-full border-4 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            {(user as { profileImage?: string } | null)?.profileImage ? (
              <Image
                src={(user as { profileImage: string }).profileImage}
                alt="Profile"
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-slate-300" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            {!hideMarkButton && (
              <button
                type="button"
                onClick={handleMarkAttendance}
                disabled={marking}
                className={`mt-4 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:shadow-xl ${theme.button} disabled:opacity-60`}
              >
                <Scan className="w-5 h-5" />
                {marking ? "Marking..." : "Mark Attendance"}
              </button>
            )}
            {markSuccess && <p className="text-green-600 text-sm mt-2">{markSuccess}</p>}
          </div>
        </div>
      </section>

      {/* Month stats */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-slate-500">This month</span>
          <span className="text-sm font-semibold text-emerald-600">On track</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Working days</p>
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
            <p className="text-xs text-slate-400">Logged this month</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Present</p>
            <p className="text-xl font-bold text-slate-900">{presentCount}</p>
            <p className="text-xs text-slate-400">Full / half day</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Punctuality</p>
            <p className="text-xl font-bold text-slate-900">
              {totalCount ? Math.round((presentCount / totalCount) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400">Attendance rate</p>
          </div>
        </div>
      </section>

      {/* Recent logs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent logs</h2>
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No attendance logs found</p>
            <p className="text-slate-400 text-sm mt-1">Mark your first attendance using face verification above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => {
              const dateStr = getLogDate(log);
              const dateObj = new Date(dateStr);
              const dayNum = dateObj.getDate();
              const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });
              const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
              const checkIn = formatTime(getCheckInTime(log));
              const checkOut = formatTime(getCheckOutTime(log));
              const style = getStatusStyle(log.status);
              return (
                <div
                  key={log._id || dateStr || Math.random()}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-500">{monthShort}</span>
                      <span className="text-lg font-bold text-slate-900 leading-none">{dayNum}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{weekday}</p>
                      <p className="text-sm text-slate-500">
                        {checkIn} – {checkOut}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
