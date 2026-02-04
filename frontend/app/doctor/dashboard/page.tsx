"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { attendanceService, AttendanceLog } from "@/services/attendance.service";
import { LogOut, MapPin, Camera, Clock, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function DoctorDashboard() {
  const { user, logout } = useAuthContext();
  const [logs, setLogs] = useState<any[]>([]); // Backend returns varied structure, using any for now or strictly typing if known
  // Based on logs/me controller: returns { success: true, data: result }. result depends on service.
  // Assuming array of logs.

  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Attendance Mark State
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchLogs();
    // Auto-get location if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toString());
          setLng(pos.coords.longitude.toString());
        },
        (err) => console.error("Geo error", err)
      );
    }
  }, []);

  async function fetchLogs() {
    try {
      const res = await attendanceService.getMyLogs();
      if (res.data) {
        // Response info: message: "Attendance fetched...", data: result
        // result might be an object or array. Service "getAttendanceService" usually returns list.
        setLogs(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error("Fetch logs failed", err);
    }
  }

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !lat || !lng) {
      setError("Location and Face Image are required.");
      return;
    }

    setMarking(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("lat", lat);
      formData.append("lng", lng);
      formData.append("faceImage", file);

      const res = await attendanceService.markAttendance(formData);
      setMessage(res.message || "Attendance marked successfully!");
      fetchLogs(); // Refresh logs
      setFile(null); // Reset file
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-100 text-cyan-700 p-2 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Doctor Portal</h1>
            <p className="text-xs text-gray-500">Welcome, Dr. {user?.name}</p>
          </div>
        </div>
        <Link
          href="/medicine-store"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg transition mr-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">Pharmacy</span>
        </Link>
        <button
          onClick={() => logout({ redirectTo: "/auth/login" })}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-8">

        {/* Mark Attendance Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-600" />
                Mark Attendance
              </h2>
              <p className="text-sm text-gray-500">
                Capture your face to mark attendance. Ensure you are within the allowed hospital radius.
              </p>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              {message && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">{message}</div>}

              <form onSubmit={handleMarkAttendance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Latitude</label>
                    <input value={lat} onChange={e => setLat(e.target.value)} className="w-full border rounded p-2 text-sm bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Longitude</label>
                    <input value={lng} onChange={e => setLng(e.target.value)} className="w-full border rounded p-2 text-sm bg-gray-50" />
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">
                      {file ? file.name : "Tap to capture/upload face"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={marking}
                  className="w-full bg-cyan-600 text-white py-2.5 rounded-lg font-semibold hover:bg-cyan-700 transition disabled:opacity-50"
                >
                  {marking ? "Verifying Face..." : "Submit Attendance"}
                </button>
              </form>
            </div>

            {/* Stats / Info */}
            <div className="md:w-1/3 bg-cyan-50 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-3">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                📍
              </div>
              <div>
                <h3 className="font-bold text-cyan-900">Geofence Active</h3>
                <p className="text-xs text-cyan-700 mt-1">
                  Attendance requires valid GPS coordinates matching hospital records.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Logs Table */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">My Attendance History</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Check In</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Check Out</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* 
                       Note: Backend response structure for logs isn't fully visible in snippets, 
                       assuming standard fields based on other controllers.
                       Adjust fields if backend uses different keys (e.g., loginTime vs checkIn).
                    */}
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No attendance logs found.</td>
                    </tr>
                  ) : (
                    logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {new Date(log.date || log.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                              ${log.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                            `}>
                            {log.status || "Present"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
