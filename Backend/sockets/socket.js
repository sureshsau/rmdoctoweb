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
  // Clients join a private room keyed by their user id so the notification
  // service can push a broadcast copy straight to the right recipient.
  socket.on("notification:register", (userId) => {
    if (!userId) return;
    socket.join(`user:${String(userId)}`);
  });

  socket.on("notification:unregister", (userId) => {
    if (!userId) return;
    socket.leave(`user:${String(userId)}`);
  });
})

export {app, io, server};
