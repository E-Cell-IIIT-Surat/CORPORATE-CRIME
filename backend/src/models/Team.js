import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["A", "B", "C", "D", "E"]
    },
    password: { type: String, required: true },
    
    // Team Details
    teamLeader: { type: String, required: true },
    teamLeaderEmail: { type: String, required: true },
    members: [{
      name: String,
      email: String
    }],

    // Approval System
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    
    // Game Tracking
    score: { type: Number, default: 0 },
    penalties: { type: Number, default: 0 },
    currentStep: { type: Number, default: 1 },
    lastWrongScanTime: { type: Date },
    startTime: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
