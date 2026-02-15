import { apiClient } from "@/lib/apiClient";

export type Appointment = {
    _id: string;
    doctorId: { name: string } | string;
    patientName: string;
    patientPhone: string;
    patientAge: number;
    patientGender: string;
    appointmentDate: string;
    appointmentTime: string;
    consultationFee: number;
    symptoms?: string;
    notes?: string;
};

export type AppointmentPagination = {
    page: number;
    totalPages: number;
    totalRecords?: number;
};

export type GetAppointmentsResponse = {
    success: boolean;
    data: Appointment[];
    pagination: AppointmentPagination;
};

export const receptionistAppointmentService = {
    async getAppointments({ page = 1, type = "all", limit = 10 } = {}) {
        // If type is 'all', omit the type param to get all appointments
        const url = type === "all"
            ? `/appointment/bookings?page=${page}&limit=${limit}`
            : `/appointment/bookings?page=${page}&limit=${limit}&type=${type}`;
        const res = await apiClient.get<GetAppointmentsResponse>(url);
        return res.data;
    },
};
