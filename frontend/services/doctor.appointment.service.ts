import { apiClient } from "@/lib/apiClient";
import { Appointment, GetAppointmentsResponse } from "@/services/receptionist.appointment.service";

export const doctorAppointmentService = {
  async getAppointments({ doctorId, page = 1, type = "all", limit = 10 } : { doctorId: string, page?: number, type?: string, limit?: number }) {
    // If type is 'all', omit the type param to get all appointments
    let url = `/appointment/bookings?doctorId=${doctorId}&page=${page}&limit=${limit}`;
    if (type !== "all") url += `&type=${type}`;
    const res = await apiClient.get<GetAppointmentsResponse>(url);
    return res.data;
  },
};
