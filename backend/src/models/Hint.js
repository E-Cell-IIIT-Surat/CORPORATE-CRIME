import mongoose from "mongoose";

const hintSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  category: {
    type: String,
    enum: ["A", "B", "C", "D", "E", "ALL"],
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
hintSchema.index({ step: 1, category: 1, isActive: 1 });

export default mongoose.model("Hint", hintSchema);
