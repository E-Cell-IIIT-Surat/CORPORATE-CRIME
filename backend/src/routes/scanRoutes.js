import express from "express";
import { scanQR, verifyAnswer } from "../controllers/scanController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.post("/scan", protect, asyncHandler(scanQR));
router.post("/verify", protect, asyncHandler(verifyAnswer));

export default router;
