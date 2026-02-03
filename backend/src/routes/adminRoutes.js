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
const useUpload = process.env.VERCEL ? (req, res, next) => next() : upload.single("image");

router.post("/login", adminLogin);

/* GLOBAL GAME CONTROLS */
router.get("/status", adminProtect, getGameStatus);
router.post("/toggle", adminProtect, toggleGame);

router.post("/location", adminProtect, createLocation);
router.post("/question", adminProtect, useUpload, createQuestion);
router.get("/questions", adminProtect, getAllQuestions);
router.delete("/question/:id", adminProtect, deleteQuestion);

/* CLUE MANAGEMENT */
router.post("/clue", adminProtect, useUpload, createClue);
router.get("/clues", adminProtect, getAllClues);
router.put("/clue/:id", adminProtect, useUpload, updateClue);
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
