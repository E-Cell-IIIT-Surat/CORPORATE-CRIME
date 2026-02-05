import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Hint from "../models/Hint.js";

const router = express.Router();

// Get hints for current team's step
router.get("/", protect, async (req, res) => {
  try {
    const team = req.team;
    const currentStep = team.currentStep;

    // Get hints for team's category and step, or ALL category
    const hints = await Hint.find({
      step: currentStep,
      $or: [
        { category: team.category },
        { category: "ALL" }
      ],
      isActive: true
    }).sort({ createdAt: -1 });

    res.json(hints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
