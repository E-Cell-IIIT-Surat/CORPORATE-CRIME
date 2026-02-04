import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import teamRoutes from "./routes/teamRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import clueRoutes from "./routes/clueRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

// Connect to MongoDB 
connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Only serve uploads folder locally (not in Vercel)
if (!process.env.VERCEL) {
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
}

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next();
});

app.get("/", (req, res) => {
  res.send("QR Hunt Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date(),
    mongoUri: process.env.MONGO_URI ? "✓ Set" : "✗ NOT SET",
    mongoConnected: mongoose.connection.readyState === 1 ? "✓ Connected" : "✗ Disconnected",
    jwtSecret: process.env.JWT_SECRET ? "✓ Set" : "✗ NOT SET",
    env: process.env.NODE_ENV || "development"
  });
});
app.use("/api/team", teamRoutes);
app.use("/api/qr", scanRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clue", clueRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

export default app;

// Only listen if running locally (not in Vercel/serverless)
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down gracefully...');
  console.error('Error:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  console.error('Reason:', reason);
  process.exit(1);
});
