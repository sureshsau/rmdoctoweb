import { apiClient } from "@/lib/apiClient";
import { AuthUser } from "./auth.service";

export type GetAllDoctorsResponse = {
    success: boolean;
    message: string;
    count?: number;
    data: AuthUser[];
};

export type BookAppointmentRequest = {
    doctorId: string;
    patientName: string;
    patientPhone: string;
    patientAge: string;
    patientGender: string;
    appointmentDate: string;
    appointmentTime: string;
    consultationFee: string;
    symptoms?: string;
    notes?: string;
};

export const receptionistService = {
    async getAllDoctors() {
        const res = await apiClient.get<GetAllDoctorsResponse>("/user/doctors");
        return res.data;
    },

    async bookAppointment(payload: BookAppointmentRequest) {
        const res = await apiClient.post("/appointment", payload);
        return res.data;
    },
};
