'use client';

import React, { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

type Props = {
  onClose: () => void;
};

export default function AttendanceSettingsModal({ onClose }: Props) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    shiftStartTime: "",
    shiftEndTime: "",
    requiredHoursPerDay: "",
    halfDayMinHours: "",
    graceMinutes: "",
    weeklyOffDays: [] as string[],
    overtimeAllowed: false,
    otAfterHours: "",
    latitude: "",
  longitude: "",

  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/attendance/setAttendanceSettings`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("✅ Attendance settings applied to ALL users");
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Update failed");
      console.log(err);
    } finally {
      setLoading(false);
      
    }
  };



  // Fetch User location 
  const fetchCurrentLocation = () => {
  if (!navigator.geolocation) {
    setError("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);

      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      setError("");
      setSuccess("✅ Location fetched successfully");
    },
    (err) => {
      console.error(err);
      setError("Failed to fetch location. Please allow location access.");
    }
  );
};


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
        >
          <X />
        </button>

        <h2 className="text-xl font-bold mb-4">Attendance Settings (Global)</h2>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="text-sm">Shift Start</label>
            <input
              type="time"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange("shiftStartTime", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Shift End</label>
            <input
              type="time"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange("shiftEndTime", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Required Hours</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange("requiredHoursPerDay", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Half Day Min Hours</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange("halfDayMinHours", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Grace Minutes</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange("graceMinutes", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">OT After (Hours)</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              onChange={(e) => handleChange("otAfterHours", e.target.value)}
            />
          </div>
        </div>
        {/* ✅ Location Settings */}
<div className="mt-6">
  <h3 className="font-semibold mb-2">Office Location</h3>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm">Latitude</label>
      <input
        type="text"
        value={form.latitude}
        className="w-full border p-2 rounded"
        onChange={(e) => handleChange("latitude", e.target.value)}
        placeholder="e.g. 28.6139"
      />
    </div>

    <div>
      <label className="text-sm">Longitude</label>
      <input
        type="text"
        value={form.longitude}
        className="w-full border p-2 rounded"
        onChange={(e) => handleChange("longitude", e.target.value)}
        placeholder="e.g. 77.2090"
      />
    </div>
  </div>

  <button
    type="button"
    onClick={fetchCurrentLocation}
    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
  >
    📍 Fetch Current Location
  </button>
</div>


        {/* Weekly Off */}
        <div className="mt-4">
          <label className="text-sm block mb-1">Weekly Off Days</label>
          <div className="flex flex-wrap gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <button
                key={day}
                onClick={() =>
                  handleChange(
                    "weeklyOffDays",
                    form.weeklyOffDays.includes(day)
                      ? form.weeklyOffDays.filter((d) => d !== day)
                      : [...form.weeklyOffDays, day]
                  )
                }
                className={`px-3 py-1 rounded border ${
                  form.weeklyOffDays.includes(day)
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Overtime Toggle */}
        <div className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.overtimeAllowed}
            onChange={(e) =>
              handleChange("overtimeAllowed", e.target.checked)
            }
          />
          <span className="text-sm">Allow Overtime</span>
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="mt-6 w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
        >
          {loading ? "Saving..." : "Apply To All Users"}
        </button>
      </div>
    </div>
  );
}
