import {Server} from 'socket.io';
import express from 'express';
import { createServer } from "http";
const app = express();
const server = createServer(app);


const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true,
  },
});


io.on('connection', (socket) =>{
})

export {app, io, server};