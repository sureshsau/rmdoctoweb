import { apiClient } from "@/lib/apiClient";

export type AttendanceSettings = {
  shiftStartTime: string;
  shiftEndTime: string;
  requiredHoursPerDay?: number;
  halfDayMinHours?: number;
  graceMinutes?: number;
  weeklyOffDays?: string[]; // Array of strings e.g. ["Sunday"]
  allowedLocation?: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
};

export type AttendanceLog = {
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  date: string;
  // Add other fields from backend model if needed for display
};

export const attendanceService = {
  // SETTINGS
  async getGlobalSettings() {
    // Backend: GET /attendance/settings
    // If Admin, returns { scope: "all", data: [...] }
    // Ideally we want the "current" global setting. 
    // The backend `getAttendanceSettingsController` logic says "CASE 1: Admin -> returns all settings".
    // Wait, `setAttendanceSettingsForAllUsersController` sets it for everyone. 
    // It seems there isn't a "get one global setting" endpoint, it returns ARRAY of settings for all users?
    // Let's assume for the "Settings Page", we might be setting a policy that gets applied.
    // However, if we want to *View* current policy, we might have to pick one or just not show "current" if backend doesn't support "Get Global Template".
    const res = await apiClient.get("/attendance/settings");
    return res.data;
  },

  async setGlobalSettings(settings: AttendanceSettings) {
    // Backend: POST /attendance/setAttendanceSettings
    const res = await apiClient.post("/attendance/setAttendanceSettings", settings);
    return res.data;
  },

  // LOGS (for Dashboards)
  async getMyLogs() {
    // GET /attendance/logs/me
    const res = await apiClient.get("/attendance/logs/me");
    return res.data;
  },

  // MARK (for Doctor/Staff)
  async markAttendance(data: FormData) {
    // POST /attendance/mark
    // Requires lat, lng, faceImage
    const res = await apiClient.post("/attendance/mark", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
};
