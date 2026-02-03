import express from "express";
import { teamLogin, registerTeam, getGameStatus, getMe, getLeaderboard, getQualificationStatus } from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", teamLogin);
router.post("/register", registerTeam);
router.get("/game-status", protect, getGameStatus);
router.get("/me", protect, getMe);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/qualified", protect, getQualificationStatus);

export default router;
