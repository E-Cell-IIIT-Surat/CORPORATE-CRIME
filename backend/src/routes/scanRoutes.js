import express from "express";
import { scanQR, verifyAnswer } from "../controllers/scanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/scan", protect, scanQR);
router.post("/verify", protect, verifyAnswer);

export default router;
