import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import teamRoutes from "../routes/teamRoutes.js";
import scanRoutes from "../routes/scanRoutes.js";
import quizRoutes from "../routes/quizRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import clueRoutes from "../routes/clueRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB
connectDB();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL || "https://yourfrontend.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("QR Hunt Backend Running");
});

app.get("/api", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/team", teamRoutes);
app.use("/api/qr", scanRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clue", clueRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
