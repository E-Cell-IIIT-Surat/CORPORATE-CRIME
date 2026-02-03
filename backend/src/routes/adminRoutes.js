import express from "express";
import { adminLogin } from "../controllers/adminController.js";
import { adminProtect } from "../middleware/adminMiddleware.js";
import { upload } from "../utils/upload.js";

import {
  createLocation,
  createQuestion,
  getAllQuestions,
  deleteQuestion,
  createClue,
  getAllClues,
  updateClue,
  deleteClue,
  getLeaderboard,
  getQualifiers,
  getAllTeams,
  resetTeam,
  getGameStatus,
  toggleGame,
  removePenalty,
  adjustTime,
  deleteTeam
} from "../controllers/adminGameController.js";

const router = express.Router();

router.post("/login", adminLogin);

/* GLOBAL GAME CONTROLS */
router.get("/status", adminProtect, getGameStatus);
router.post("/toggle", adminProtect, toggleGame);

router.post("/location", adminProtect, createLocation);
router.post("/question", adminProtect, upload.single("image"), createQuestion);
router.get("/questions", adminProtect, getAllQuestions);
router.delete("/question/:id", adminProtect, deleteQuestion);

/* CLUE MANAGEMENT */
router.post("/clue", adminProtect, upload.single("image"), createClue);
router.get("/clues", adminProtect, getAllClues);
router.put("/clue/:id", adminProtect, upload.single("image"), updateClue);
router.delete("/clue/:id", adminProtect, deleteClue);

/* TEAM MANAGEMENT */
router.get("/teams", adminProtect, getAllTeams);
router.get("/leaderboard", adminProtect, getLeaderboard);
router.get("/qualifiers", adminProtect, getQualifiers);
router.post("/reset-team/:id", adminProtect, resetTeam);
router.post("/remove-penalty/:id", adminProtect, removePenalty);
router.post("/adjust-time/:id", adminProtect, adjustTime);
router.delete("/team/:id", adminProtect, deleteTeam);

export default router;
