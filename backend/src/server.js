import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import teamRoutes from "./routes/teamRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import clueRoutes from "./routes/clueRoutes.js";
dotenv.config();
connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

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
  res.json({ status: "OK", timestamp: new Date() });
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

export default app;

// Only listen if running locally (not in Vercel/serverless)
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  });
}
