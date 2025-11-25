import dotenv from 'dotenv';
dotenv.config();
import { NotificationTemplate } from './models/notificationTemplate.model.js';
import mongoose from 'mongoose';
const templates = [
  {
    code: "NEW_USER_REQUEST",
    title: "New User Registration Request",
    message: "{{name}} ({{email}}) submitted a registration request.",
    category: "USER",
    severity: "info",
    sendToRoles: ["admin"],
    placeholders: ["name", "email", "pendingId"],
    actions: [
      {
        label: "Approve",
        type: "APPROVE_USER",
        apiEndpoint: "/admin/approve-user",
        method: "POST",
        requiresPayload: true
      },
      {
        label: "Reject",
        type: "REJECT_USER",
        apiEndpoint: "/admin/reject-user",
        method: "POST",
        requiresPayload: true
      }
    ]
  },

  {
    code: "USER_APPROVED",
    title: "User Approved",
    message: "User {{name}} has been approved.",
    category: "USER",
    severity: "info",
    sendToRoles: [],
    placeholders: ["name"],
    actions: []
  },

  {
    code: "USER_REJECTED",
    title: "User Rejected",
    message: "User {{name}} was rejected. Reason: {{reason}}",
    category: "USER",
    severity: "warning",
    sendToRoles: [],
    placeholders: ["name", "reason"],
    actions: []
  },

  {
    code: "PATIENT_REGISTERED",
    title: "Patient Registered",
    message: "A new patient {{patientName}} has been registered.",
    category: "PATIENT",
    severity: "info",
    sendToRoles: ["admin", "doctor"],
    placeholders: ["patientName"],
    actions: []
  },

  {
    code: "PATIENT_CHECKIN",
    title: "Patient Check-in",
    message: "Patient {{patientName}} checked in at {{time}}.",
    category: "PATIENT",
    severity: "info",
    sendToRoles: ["admin", "doctor"],
    placeholders: ["patientName", "time"],
    actions: []
  },

  {
    code: "PATIENT_ADMITTED",
    title: "Patient Admitted",
    message: "Patient {{patientName}} has been admitted to {{wardName}}.",
    category: "PATIENT",
    severity: "warning",
    sendToRoles: ["admin", "doctor", "nurse"],
    placeholders: ["patientName", "wardName"],
    actions: []
  },

  {
    code: "PATIENT_CHECKOUT",
    title: "Patient Checkout",
    message: "Patient {{patientName}} has been discharged.",
    category: "PATIENT",
    severity: "info",
    sendToRoles: ["admin", "doctor"],
    placeholders: ["patientName"],
    actions: []
  },

  {
    code: "APPOINTMENT_BOOKED",
    title: "Appointment Booked",
    message:
      "Appointment booked for patient {{patientName}} with Dr. {{doctorName}}.",
    category: "APPOINTMENT",
    severity: "info",
    sendToRoles: ["admin", "doctor"],
    placeholders: ["patientName", "doctorName"],
    actions: [
      {
        label: "View Appointment",
        apiEndpoint: "/admin/appointments/{{appointmentId}}",
        method: "GET",
        requiresPayload: false
      }
    ]
  },

  {
    code: "APPOINTMENT_CANCELLED",
    title: "Appointment Cancelled",
    message:
      "Appointment for {{patientName}} with Dr. {{doctorName}} was cancelled.",
    category: "APPOINTMENT",
    severity: "warning",
    sendToRoles: ["admin", "doctor"],
    placeholders: ["patientName", "doctorName"],
    actions: []
  },

  {
    code: "APPOINTMENT_RESCHEDULED",
    title: "Appointment Rescheduled",
    message:
      "Appointment rescheduled to {{newTime}} for patient {{patientName}}.",
    category: "APPOINTMENT",
    severity: "info",
    sendToRoles: ["admin", "doctor"],
    placeholders: ["patientName", "newTime"],
    actions: []
  },

  {
    code: "TEST_REQUEST_CREATED",
    title: "Test Request Created",
    message:
      "A new test request for patient {{patientName}} has been created.",
    category: "LAB",
    severity: "info",
    sendToRoles: ["lab", "admin", "doctor"],
    placeholders: ["patientName"],
    actions: []
  },

  {
    code: "TEST_REPORT_READY",
    title: "Test Report Ready",
    message: "Test report for patient {{patientName}} is ready.",
    category: "LAB",
    severity: "info",
    sendToRoles: ["doctor", "admin"],
    placeholders: ["patientName"],
    actions: [
      {
        label: "View Report",
        apiEndpoint: "/reports/{{reportId}}",
        method: "GET",
        requiresPayload: false
      }
    ]
  },

  {
    code: "INVOICE_GENERATED",
    title: "Invoice Generated",
    message:
      "Invoice generated for patient {{patientName}}.",
    category: "BILLING",
    severity: "info",
    sendToRoles: ["admin", "accountant"],
    placeholders: ["patientName"],
    actions: [
      {
        label: "View Invoice",
        apiEndpoint: "/billing/{{invoiceId}}",
        method: "GET",
        requiresPayload: false
      }
    ]
  },

  {
    code: "PAYMENT_SUCCESS",
    title: "Payment Successful",
    message:
      "Payment of ₹{{amount}} received for patient {{patientName}}.",
    category: "BILLING",
    severity: "info",
    sendToRoles: ["admin", "accountant"],
    placeholders: ["patientName", "amount"],
    actions: []
  },

  {
    code: "EMERGENCY_ALERT",
    title: "Emergency Alert",
    message: "Emergency reported: {{details}}",
    category: "EMERGENCY",
    severity: "critical",
    sendToRoles: ["admin", "doctor", "nurse"],
    placeholders: ["details"],
    actions: [
      {
        label: "View Emergency",
        apiEndpoint: "/emergency/{{emergencyId}}",
        method: "GET",
        requiresPayload: false
      }
    ]
  },

  {
    code: "NEW_CHAT_MESSAGE",
    title: "New Message",
    message: "You have a new message from {{senderName}}.",
    category: "CHAT",
    severity: "info",
    sendToRoles: [],
    placeholders: ["senderName"],
    actions: [
      {
        label: "Open Chat",
        apiEndpoint: "/chat/{{chatId}}",
        method: "GET",
        requiresPayload: false
      }
    ]
  },

  {
    code: "DOCTOR_LATE_CHECKIN",
    title: "Doctor Late",
    message: "Dr. {{doctorName}} has not checked in.",
    category: "ATTENDANCE",
    severity: "warning",
    sendToRoles: ["admin"],
    placeholders: ["doctorName"],
    actions: []
  },

  {
    code: "NEW_PATIENT_ASSIGNED",
    title: "New Patient Assigned",
    message:
      "A new patient {{patientName}} has been assigned to you.",
    category: "DOCTOR",
    severity: "info",
    sendToRoles: ["doctor"],
    placeholders: ["patientName"],
    actions: [
      {
        label: "View Patient",
        apiEndpoint: "/doctor/patient/{{patientId}}",
        method: "GET",
        requiresPayload: false
      }
    ]
  }
];


const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB...");
    console.log("Deleting existing templates...");
    await NotificationTemplate.deleteMany({});

    console.log("Seeding new templates...");
    await NotificationTemplate.insertMany(templates);

    console.log("🎉 Notification templates seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding templates:", err);
    process.exit(1);
  }
};

start();