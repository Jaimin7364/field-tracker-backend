import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";

// === CONFIG ===
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://field-tracker-frontend.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "https://field-tracker-frontend.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));

// === MONGO SETUP ===
const MONGO_URI = "Mongo_URI";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// === MONGOOSE MODEL ===
const snapshotSchema = new mongoose.Schema({
  image: String,
  location: Object,
  timestamp: { type: Date, default: Date.now }
});
const Snapshot = mongoose.model("Snapshot", snapshotSchema);

// === TEST ROUTE ===
app.get("/", (req, res) => {
  res.send("🟢 Field Tracker backend running...");
});

// === SOCKET.IO HANDLERS ===
io.on("connection", (socket) => {
  console.log("Worker/Admin connected:", socket.id);

  // Worker sends snapshot
  socket.on("snapshot", async (data) => {
    const { image, location } = data;

    // save to DB
    const snap = new Snapshot({ image, location });
    await snap.save();

    // send to all admins
    io.emit("new-snapshot", { image, location });
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// === START SERVER ===
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
