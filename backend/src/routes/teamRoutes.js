import express from "express";
import { teamLogin, registerTeam, getGameStatus, getMe, getLeaderboard, getQualificationStatus } from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.post("/login", asyncHandler(teamLogin));
router.post("/register", asyncHandler(registerTeam));
router.get("/game-status", protect, asyncHandler(getGameStatus));
router.get("/me", protect, asyncHandler(getMe));
router.get("/leaderboard", protect, asyncHandler(getLeaderboard));
router.get("/qualified", protect, asyncHandler(getQualificationStatus));

export default router;
