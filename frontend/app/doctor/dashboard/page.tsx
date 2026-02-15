"use client";
import React, { useEffect, useState } from "react";
import { doctorAppointmentService } from "@/services/doctor.appointment.service";
import { AuthUser } from "@/services/auth.service";
import { Appointment } from "@/services/receptionist.appointment.service";
// import { useAuthContext } from "@/state/AuthContext"; // Uncomment if available

// Dummy user for demonstration; replace with real auth context
const dummyUser: AuthUser = { id: "DOCTOR_ID", name: "Dr. John Doe" };

export default function DoctorDashboard() {
	// Replace with: const { user } = useAuthContext();
	const user = dummyUser;
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchAppointments() {
			setLoading(true);
			setError(null);
			try {
				const res = await doctorAppointmentService.getAppointments({
					doctorId: user.id!,
					page: 1,
					type: "today",
					limit: 5,
				});
				setAppointments(res.data || []);
			} catch (err: any) {
				setError("Failed to load today's appointments");
			} finally {
				setLoading(false);
			}
		}
		if (user?.id) fetchAppointments();
	}, [user?.id]);

	return (
		<div className="max-w-4xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>
			<p className="text-gray-600 mb-6">Welcome, {user?.name || "Doctor"}!</p>
			<section className="mb-8">
				<h2 className="text-lg font-semibold mb-2">Today's Appointments</h2>
				{loading ? (
					<div>Loading...</div>
				) : error ? (
					<div className="text-red-500">{error}</div>
				) : appointments.length === 0 ? (
					<div>No appointments for today.</div>
				) : (
					<ul className="space-y-2">
						{appointments.map((appt) => (
							<li
								key={appt._id}
								className="p-4 bg-white rounded shadow border"
							>
								<div className="font-bold">{appt.patientName}</div>
								<div className="text-sm text-gray-500">
									{appt.appointmentDate} at {appt.appointmentTime}
								</div>
								<div className="text-sm">Phone: {appt.patientPhone}</div>
								<div className="text-sm">Fee: ₹{appt.consultationFee}</div>
							</li>
						))}
					</ul>
				)}
			</section>
			{/* TODO: Add 'All Appointments' tab/section here */}
		</div>
	);
}
