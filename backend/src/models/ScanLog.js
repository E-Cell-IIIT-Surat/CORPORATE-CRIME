import mongoose from "mongoose";

const scanLogSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  isCorrect: Boolean,
  timeTaken: { type: Number, default: 0 }, // seconds taken to answer this challenge
  pointsAwarded: { type: Number, default: 0 }, // points earned for this step
  scannedAt: { type: Date, default: Date.now }
});

export default mongoose.model("ScanLog", scanLogSchema);
