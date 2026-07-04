import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import connectdb from "./config/mongoDB.config.js";
import { app, server } from "./sockets/socket.js";

import authRouter from "./routes/auth.route.js";
import attendanceRouter from "./routes/attendance.route.js";
import rolesRoute from "./routes/role.route.js";
import roleAssignmentsRoute from "./routes/roleAssignments.route.js";
import userRoute from "./routes/user.route.js";
import permissionRoute from "./routes/permission.route.js";
import agentRoute from "./routes/agent.route.js";
import medicineRouter from "./routes/medicine.route.js";
import medicineOrderRoute from './routes/medicineOrder.route.js'
import rmcreditRoute from "./routes/rmcredit.route.js";
import AppError from "./utils/AppError.js";
import { ensureRekognitionCollection, wipeAllFacesFromRekognition } from "./services/aws.service.js";
import marketingAgentRoute from './routes/marketingAgent.route.js'
import Razorpay from "razorpay";
import razorpay from "./config/razorpay.config.js";
import appointmentRoute from './routes/appointment.routes.js';
import rmcoinRoute from "./routes/rmcoin.route.js";
import axios from "axios";
import loginRoute from './routes/login.route.js'
import adminRoute from './routes/admin.route.js'
import labRouter from './routes/lab.route.js'
import labOrderRoute from './routes/labOrder.route.js'
/* ================= CORS ================= */

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8081",
      "http://172.20.10.2:8081",
      "https://www.rmdocto.in",
      "https://rmdocto.in",
    ],
    credentials: true,
  })
);

/* ================= HEALTH ================= */

app.get("/", (req, res) => {
  res.json({ message: "working backend" });
});

/* ================= ROUTES WITHOUT FILE UPLOAD ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/attendance", attendanceRouter);
app.use("/roles", rolesRoute);
app.use("/role-assignments", roleAssignmentsRoute);
app.use("/user", userRoute);
app.use("/permission", permissionRoute);
app.use("/agent", agentRoute);
app.use("/medicine/order", medicineOrderRoute);
app.use("/marketing-agent", marketingAgentRoute)
app.use("/appointment", appointmentRoute)
app.use("/rmcredit", rmcreditRoute);
app.use("/rmcoin", rmcoinRoute);
app.use("/admin", adminRoute);
app.use("/lab/order", labOrderRoute);
/* ================= ROUTES WITH FILE UPLOAD =================*/
// multer must receive raw stream → NO body parser before this
app.use("/medicines", medicineRouter);
app.use("/login", loginRoute);
app.use("/labs", labRouter);








/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* ================= START ================= */

const port = process.env.PORT || 3000;

server.listen(port, () => {
  connectdb();
  console.log(`app is listening on port ${port}`);
});

try {
  // wipeAllFacesFromRekognition().then(() => ensureRekognitionCollection());
} catch (err) {
  console.error("Rekognition error", err);
}
