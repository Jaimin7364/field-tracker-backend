import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema({
  workerId: String,
  frame: String,
  location: {
    lat: Number,
    lon: Number,
  },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Snapshot", snapshotSchema);
