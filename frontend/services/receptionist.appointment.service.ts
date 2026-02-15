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
    async getAppointments({ page = 1, type = "today", limit = 10 } = {}) {
        const res = await apiClient.get<GetAppointmentsResponse>(`/appointment/bookings?page=${page}&limit=${limit}&type=${type}`);
        return res.data;
    },
};
