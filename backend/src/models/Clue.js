import mongoose from "mongoose";

const clueSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  category: {
    type: String,
    enum: ["A", "B", "C", "D", "E", "ALL"],
    required: true
  },
  text: { type: String, required: true }, // riddle / hint
  imageUrl: { type: String } // Now stores base64 data URLs instead of file paths
});

// Ensure only one clue per (step, category)
clueSchema.index({ step: 1, category: 1 }, { unique: true });

export default mongoose.model("Clue", clueSchema);
