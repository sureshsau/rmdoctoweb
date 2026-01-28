import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectdb from "./config/mongoDB.config.js";
import authRouter from './routes/auth.route.js'
import {app, io,  server} from './sockets/socket.js';
import attendanceRouter from './routes/attendance.route.js'
import rolesRoute from './routes/role.route.js'
import roleAssignmentsRoute from './routes/roleAssignments.route.js'
import userRoute from './routes/user.route.js'
import permissionRoute from './routes/permission.route.js'
import AppError from './utils/AppError.js';
import cors from 'cors';
import { ensureRekognitionCollection } from './services/aws.service.js';
import agentRoute from './routes/agent.route.js'
import medicineRouter from './routes/medicine.route.js'

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin:"*",
    credentials:true
}))

app.get("/",(req,res)=>{
  res.json({
    message:"working backend"
  })
})

app.use('/auth', authRouter);
app.use('/attendance',attendanceRouter)
app.use('/roles',rolesRoute);
app.use('/role-assignments',roleAssignmentsRoute);
app.use('/user',userRoute);
app.use('/permission',permissionRoute);
app.use('/agent',agentRoute)
app.use('/medicines',medicineRouter)

const port = process.env.PORT || 3000;
server.listen(port,()=>{
    connectdb();
    console.log(`app is listing on port ${port}`);
})

try{
  ensureRekognitionCollection()
}catch(err){

}

app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});