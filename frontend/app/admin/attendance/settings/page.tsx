"use client";

import { useState } from "react";
import { Clock, MapPin, Save, Calendar } from "lucide-react";
import { attendanceService, AttendanceSettings } from "@/services/attendance.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function AdminAttendanceSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<AttendanceSettings>({
        shiftStartTime: "09:00",
        shiftEndTime: "17:00",
        requiredHoursPerDay: 8,
        halfDayMinHours: 4,
        graceMinutes: 15,
        weeklyOffDays: ["Sunday"],
        allowedLocation: {
            lat: 0,
            lng: 0,
            radiusMeters: 100,
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            allowedLocation: {
                ...prev.allowedLocation!,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleDayToggle = (day: string) => {
        setFormData(prev => {
            const current = prev.weeklyOffDays || [];
            if (current.includes(day)) {
                return { ...prev, weeklyOffDays: current.filter(d => d !== day) };
            } else {
                return { ...prev, weeklyOffDays: [...current, day] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await attendanceService.setGlobalSettings(formData);
            setSuccess("Attendance settings updated for all users successfully!");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Attendance Settings</h1>
                <p className="text-gray-500 text-sm">Configure global shift timings and location restrictions</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 text-sm">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Shift Timings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-2 mb-4">
                        <Clock className="w-5 h-5 text-cyan-600" />
                        <h3 className="font-semibold text-gray-800">Shift Configuration</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Start Time</label>
                            <input
                                type="time"
                                name="shiftStartTime"
                                value={formData.shiftStartTime}
                                onChange={handleChange}
                                className="w-full mt-1 border rounded-lg p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">End Time</label>
                            <input
                                type="time"
                                name="shiftEndTime"
                                value={formData.shiftEndTime}
                                onChange={handleChange}
                                className="w-full mt-1 border rounded-lg p-2"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Hrs/Day</label>
                            <input
                                type="number"
                                name="requiredHoursPerDay"
                                value={formData.requiredHoursPerDay}
                                onChange={handleChange}
                                className="w-full mt-1 border rounded-lg p-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Grace (Mins)</label>
                            <input
                                type="number"
                                name="graceMinutes"
                                value={formData.graceMinutes}
                                onChange={handleChange}
                                className="w-full mt-1 border rounded-lg p-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Weekly Offs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-2 mb-4">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-800">Weekly Offs</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {days.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayToggle(day)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition
                  ${(formData.weeklyOffDays || []).includes(day)
                                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                                        : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                                    }
                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400">Selected days will be marked as holidays.</p>
                </div>

                {/* Location */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-2 mb-4">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-gray-800">Geofencing</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                name="lat"
                                value={formData.allowedLocation?.lat}
                                onChange={handleLocationChange}
                                className="w-full mt-1 border rounded-lg p-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                name="lng"
                                value={formData.allowedLocation?.lng}
                                onChange={handleLocationChange}
                                className="w-full mt-1 border rounded-lg p-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Radius (Meters)</label>
                            <input
                                type="number"
                                name="radiusMeters"
                                value={formData.allowedLocation?.radiusMeters}
                                onChange={handleLocationChange}
                                className="w-full mt-1 border rounded-lg p-2"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Employees can only mark attendance within this radius of the coordinates.</p>
                </div>

                <div className="lg:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-cyan-600 text-white px-8 py-3 rounded-lg hover:bg-cyan-700 transition shadow-lg disabled:opacity-50 font-bold"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? "Updating..." : "Update Settings"}
                    </button>
                </div>

            </form>
        </div>
    );
}
