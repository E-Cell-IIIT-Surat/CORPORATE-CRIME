import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getClue } from "../controllers/clueController.js";

const router = express.Router();

router.get("/", protect, asyncHandler(getClue));

export default router;
