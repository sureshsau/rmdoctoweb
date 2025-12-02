import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectdb from "./config/mongoDB.config.js";
import userRouter from './routes/user.route.js'
import {app, io,  server} from './sockets/socket.js';
import attendanceRouter from './routes/attendance.route.js'

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/auth', userRouter);
app.use('/attendance',attendanceRouter)

const port = process.env.PORT || 3000;
app.listen(port,()=>{
    connectdb();
    console.log(`app is listing on port ${port}`);
})