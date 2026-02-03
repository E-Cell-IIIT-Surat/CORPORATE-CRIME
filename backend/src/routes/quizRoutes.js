import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getQuiz, submitQuiz } from "../controllers/quizController.js";

const router = express.Router();

router.get("/", protect, getQuiz);
router.post("/submit", protect, submitQuiz);

export default router;
