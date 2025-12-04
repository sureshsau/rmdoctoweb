import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectdb from "./config/mongoDB.config.js";
import userRouter from './routes/user.route.js'
import {app, io,  server} from './sockets/socket.js';
import cors from 'cors';
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin:"http://localhost:3000",
}))

app.use('/auth', userRouter);


const port = process.env.PORT || 3000;
server.listen(port,()=>{
    connectdb();
    console.log(`app is listing on port ${port}`);
})