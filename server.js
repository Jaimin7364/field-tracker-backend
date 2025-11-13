import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Snapshot from "./models/Snapshot.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

mongoose.connect("mongodb+srv://techtalk736:IxMykzec4BhXmUGc@cluster.gx78d6p.mongodb.net/field-tracker")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("MongoDB Error:", err));

// Store active workers
const workers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ New socket connected");

  socket.on("worker-join", (workerId) => {
    console.log(`👷 Worker joined: ${workerId}`);
    workers.set(workerId, socket.id);
  });

  socket.on("frame", async ({ workerId, frame }) => {
    socket.broadcast.emit("frame", { workerId, frame });
    workers.set(workerId, socket.id);
  });

  socket.on("location", async ({ workerId, location }) => {
    socket.broadcast.emit("location", { workerId, location });
  });

  socket.on("disconnect", async () => {
    console.log("🔌 Socket disconnected");
  });
});

app.post("/save-snapshot", async (req, res) => {
  try {
    const { workerId, frame, location } = req.body;
    const snapshot = new Snapshot({ workerId, frame, location });
    await snapshot.save();
    res.status(200).json({ message: "Snapshot saved" });
  } catch (err) {
    console.error("❌ Error saving snapshot:", err);
    res.status(500).json({ error: "Error saving snapshot" });
  }
});

app.get("/", (req, res) => res.send("Field Tracker API running..."));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
