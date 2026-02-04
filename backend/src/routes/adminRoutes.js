import express from "express";
import { adminLogin } from "../controllers/adminController.js";
import { adminProtect } from "../middleware/adminMiddleware.js";
import { upload } from "../utils/upload.js";
import { parseFormData } from "../middleware/parseFormData.js";

import {
  createLocation,
  getAllLocations,
  updateLocation,
  deleteLocation,
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
  deleteTeam,
  getPendingTeams,
  approveTeam,
  rejectTeam
} from "../controllers/adminGameController.js";

const router = express.Router();
// On Vercel: use custom form parser, On local: use multer for file uploads
// Both convert images to base64 for database storage
const useUpload = process.env.VERCEL ? parseFormData : upload.single("image");

router.post("/login", adminLogin);

/* GLOBAL GAME CONTROLS */
router.get("/status", adminProtect, getGameStatus);
router.post("/toggle", adminProtect, toggleGame);

router.post("/location", adminProtect, createLocation);
router.get("/locations", adminProtect, getAllLocations);
router.put("/location/:id", adminProtect, updateLocation);
router.delete("/location/:id", adminProtect, deleteLocation);

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
router.get("/pending-teams", adminProtect, getPendingTeams);
router.post("/approve-team/:id", adminProtect, approveTeam);
router.post("/reject-team/:id", adminProtect, rejectTeam);
router.get("/leaderboard", adminProtect, getLeaderboard);
router.get("/qualifiers", adminProtect, getQualifiers);
router.post("/reset-team/:id", adminProtect, resetTeam);
router.post("/remove-penalty/:id", adminProtect, removePenalty);
router.post("/adjust-time/:id", adminProtect, adjustTime);
router.delete("/team/:id", adminProtect, deleteTeam);

export default router;
