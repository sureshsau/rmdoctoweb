import { apiClient } from "@/lib/apiClient";
import { Appointment, GetAppointmentsResponse } from "@/services/receptionist.appointment.service";

export const doctorAppointmentService = {
  async getAppointments({ page = 1, filterType = "all", limit = 10 }: { page?: number; filterType?: string; limit?: number }) {
    // Use the doctor-specific endpoint, authenticated user only
    let url = `/appointment/doctor/bookings?page=${page}&limit=${limit}`;
    if (filterType && filterType !== "all") url += `&filterType=${filterType}`;
    const res = await apiClient.get<GetAppointmentsResponse>(url);
    return res.data;
  },
};
