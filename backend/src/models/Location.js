import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  code: { 
    type: String, 
    unique: true, 
    required: true,
    trim: true // Automatically trim whitespace
  }, 
  order: { type: Number, required: true },
  category: { type: String, default: "ALL" }, // A, B, C, D, E or ALL
  pdfContent: { type: String }, // URL or Text content
  answer: { type: String, required: true, default: "ADMIN_ANSWER" },
});

export default mongoose.model("Location", locationSchema);
