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
};

/** Backend log entry: may use date or attendanceDate; checkIn/checkOut with time */
export type AttendanceLogEntry = {
  _id?: string;
  date?: string;
  attendanceDate?: string;
  checkIn?: { time?: string };
  checkOut?: { time?: string };
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
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

  // LOGS (for Dashboards) — backend returns { success, message, data: { range, count, logs } }
  async getMyLogs() {
    const res = await apiClient.get<{ success: boolean; message?: string; data: { range?: { from: string; to: string }; count: number; logs: AttendanceLogEntry[] } }>("/attendance/logs/me");
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
  },

  /** Setup attendance for a specific user. Backend: POST /attendance/setup/:userId */
  async setupUserAttendance(userId: string, formData: FormData) {
    const res = await apiClient.post(`/attendance/setup/${userId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async checkInFace(payload: { lat: number; lng: number; imageUrl: string; deviceInfo?: string }) {
    const formData = new FormData();
    formData.append("lat", String(payload.lat));
    formData.append("lng", String(payload.lng));
    if (payload.deviceInfo) formData.append("deviceInfo", payload.deviceInfo);

    const imageResponse = await fetch(payload.imageUrl);
    const imageBlob = await imageResponse.blob();
    formData.append("faceImage", imageBlob, "checkin.jpg");

    const res = await apiClient.post("/attendance/mark", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
};
