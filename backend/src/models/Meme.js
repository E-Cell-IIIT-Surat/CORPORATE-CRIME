import mongoose from "mongoose";

const memeSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Meme", memeSchema);
