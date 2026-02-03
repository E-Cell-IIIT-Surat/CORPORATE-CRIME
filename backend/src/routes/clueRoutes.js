import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getClue } from "../controllers/clueController.js";

const router = express.Router();

router.get("/", protect, getClue);

export default router;
