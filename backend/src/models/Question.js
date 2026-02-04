import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  category: { type: String, required: true, default: "ALL" }, // A, B, C, D, E or ALL
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  points: { type: Number, default: 10 },
  imageUrl: { type: String } // Now stores base64 data URLs instead of file paths
});

export default mongoose.model("Question", questionSchema);
