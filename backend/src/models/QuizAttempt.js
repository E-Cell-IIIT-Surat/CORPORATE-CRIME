import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    step: { type: Number },
    scoreEarned: { type: Number },
    timeTaken: { type: Number }, // seconds
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);
