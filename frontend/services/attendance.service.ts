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
  checkIn?: {
    time?: string;
    image?: { url?: string; bucket?: string; key?: string };
    [key: string]: any;
  };
  checkOut?: {
    time?: string;
    image?: { url?: string; bucket?: string; key?: string };
    [key: string]: any;
  };
  [key: string]: any;
};

export const attendanceService = {
  // SETTINGS
  async getGlobalSettings() {
    const res = await apiClient.get("/attendance/settings");
    return res.data;
  },

  async setGlobalSettings(settings: AttendanceSettings) {
    const res = await apiClient.post("/attendance/setAttendanceSettings", settings);
    return res.data;
  },

  // LOGS (for Dashboards)
  /**
   * Fetch attendance logs for the current user (with pagination/filters).
   * @param params Optional: { page, limit, from, to }
   */
  async getMyLogs(params?: { page?: number; limit?: number; from?: string; to?: string }) {
    // Always use /attendance/log/me for self
    let url = `/attendance/log/me`;
    if (params) {
      const q = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (q) url += `?${q}`;
    }
    const res = await apiClient.get(url);
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
  },

  async checkOutFace(payload: { lat: number; lng: number; imageUrl: string; deviceInfo?: string }) {
    const formData = new FormData();
    formData.append("lat", String(payload.lat));
    formData.append("lng", String(payload.lng));
    if (payload.deviceInfo) formData.append("deviceInfo", payload.deviceInfo);

    const imageResponse = await fetch(payload.imageUrl);
    const imageBlob = await imageResponse.blob();
    formData.append("faceImage", imageBlob, "checkout.jpg");

    // If your backend uses a different endpoint for checkout, change it here. Otherwise, use the same as check-in.
    const res = await apiClient.post("/attendance/mark", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async setupUserAttendance(userId: string, formData: FormData) {
  const res = await apiClient.post(`/attendance/setup/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
};