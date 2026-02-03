import mongoose from "mongoose";

const gameSettingsSchema = new mongoose.Schema({
  isStarted: { type: Boolean, default: false },
  startTime: { type: Date },
  isPaused: { type: Boolean, default: false },
  eventDurationMinutes: { type: Number, default: 120 }, // Total event duration in minutes (default 2 hours)
  endTime: { type: Date } // Calculated as startTime + duration
});

export default mongoose.model("GameSettings", gameSettingsSchema);
