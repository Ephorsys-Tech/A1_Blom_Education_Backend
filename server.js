import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
import http from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import connectToDb from "./src/config/db/db.js";

// ======================================================
// DNS (optional fix for network issues)
// ======================================================
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// ======================================================
// PORT
// ======================================================
const PORT = process.env.PORT || 5500;

// ======================================================
// HTTP SERVER
// ======================================================
const server = http.createServer(app);

// ======================================================
// SOCKET.IO SETUP (OPEN FOR WEB + MOBILE + HOSTED APPS)
// ======================================================
export const io = new Server(server, {
  cors: {
    origin: true, // 🔥 accepts all origins (React, RN, Postman, hosting)
    credentials: true,
  },
});

// ======================================================
// SOCKET EVENTS
// ======================================================
io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  // Example event (optional)
  socket.on("message", (data) => {
    console.log("Message received:", data);

    // broadcast example
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected:", socket.id);
  });
});

// ======================================================
// START SERVER
// ======================================================
const startServer = async () => {
  try {
    await connectToDb();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
