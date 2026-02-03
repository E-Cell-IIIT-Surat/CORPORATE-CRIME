import express from "express";
import cors from "cors";
import teamRoutes from "../src/routes/teamRoutes.js";
import scanRoutes from "../src/routes/scanRoutes.js";
import quizRoutes from "../src/routes/quizRoutes.js";
import adminRoutes from "../src/routes/adminRoutes.js";
import clueRoutes from "../src/routes/clueRoutes.js";
import connectDB from "../src/config/db.js";

const app = express();

// Initialize DB connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "QR Hunt Backend Running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// API Routes
app.use("/api/team", teamRoutes);
app.use("/api/qr", scanRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clue", clueRoutes);

// Error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

export default app;
