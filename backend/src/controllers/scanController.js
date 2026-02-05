import Team from "../models/Team.js";
import Location from "../models/Location.js";
import Question from "../models/Question.js";
import ScanLog from "../models/ScanLog.js";
import Clue from "../models/Clue.js";
import GameSettings from "../models/GameSettings.js";
import { SCAN_COOLDOWN } from "../utils/constants.js";
import { calculateCodeforcesScore } from "./quizController.js";

const CATEGORIES = ["A", "B", "C", "D", "E"];

const pickNewCategory = (currentCategory) => {
  if (!currentCategory) return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const choices = CATEGORIES.filter((cat) => cat !== currentCategory);
  if (choices.length === 0) return currentCategory;
  return choices[Math.floor(Math.random() * choices.length)];
};

export const scanQR = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const team = req.team;
    
    // Normalize QR code - trim whitespace and handle empty input
    const normalizedQR = qrCode?.toString().trim();
    if (!normalizedQR) {
      return res.status(400).json({
        message: "Invalid scan data. Please try again."
      });
    }

    // 1. Check Security Lockout (Cooldown)
    if (team.lastWrongScanTime) {
      const timeSinceLastWrong = Date.now() - new Date(team.lastWrongScanTime).getTime();
      if (timeSinceLastWrong < SCAN_COOLDOWN) {
        const remaining = Math.ceil((SCAN_COOLDOWN - timeSinceLastWrong) / 1000);
        return res.status(429).json({
          message: "System Locked. Cooldown active.",
          remainingSeconds: remaining
        });
      }
    }

    const location = await Location.findOne({ code: normalizedQR });
    if (!location) {
      // Unknown QR - set cooldown (no penalty)
      team.lastWrongScanTime = new Date();
      await team.save();

      await ScanLog.create({
        teamId: team._id,
        locationId: null,
        isCorrect: false
      });

      return res.status(404).json({
        message: "Invalid QR Code detected. Try again.",
        remainingSeconds: SCAN_COOLDOWN / 1000
      });
    }

    // 2. Validate Step Order
    if (location.order !== team.currentStep) {
      // Wrong sequence - set cooldown (no penalty)
      team.lastWrongScanTime = new Date();
      await team.save();

      await ScanLog.create({
        teamId: team._id,
        locationId: location._id,
        isCorrect: false
      });

      return res.status(400).json({
        message: "Incorrect Location Sequence. Try the current objective.",
        cooldown: SCAN_COOLDOWN / 1000
      });
    }

    // 3. Validate Category
    if (location.category !== "ALL" && location.category !== team.category) {
      return res.status(400).json({ 
        message: `Division Mismatch. This node is restricted to Division ${location.category}.` 
      });
    }

    // 4. Fetch the Challenge (Question)
    // Priority: Specific Category Question -> ALL Category Question
    let question = await Question.findOne({ step: team.currentStep, category: team.category });
    if (!question) {
      question = await Question.findOne({ step: team.currentStep, category: "ALL" });
    }

    // If no question exists, we cannot proceed (Admin error handling)
    if (!question) {
        return res.status(500).json({ message: "Data Corruption: No challenge found for this sector." });
    }

    // Return the question UI data and associated PDF content for unlocking
    res.json({
      message: "Location Verified. Decrypting Challenge...",
      locationId: location._id,
      pdfContent: location.pdfContent || null,
      challenge: {
        id: question._id,
        text: question.question,
        options: question.options, // If multiple choice
        points: question.points,
        imageUrl: question.imageUrl || null
      }
    });

  } catch (error) {
    console.error("Scan error:", error);
    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};

export const verifyAnswer = async (req, res) => {
  try {
    const { answer, locationId, questionId } = req.body;
    const team = req.team;

    // Double check we are on the right step
    const location = await Location.findById(locationId);
    if (!location || location.order !== team.currentStep) {
        return res.status(400).json({ message: "Synchronization Error. Refresh your link." });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Challenge data missing." });

    // Standardize answers for comparison:
    // - Convert to lowercase
    // - Trim whitespace from both ends
    // - Replace multiple spaces with single space
    // - Remove special characters except spaces
    const normalizeAnswer = (str) => {
      return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/[^a-z0-9\s]/g, ''); // Remove special chars except spaces
    };
    
    const submitted = normalizeAnswer(answer);
    const correct = normalizeAnswer(question.correctAnswer);

    if (submitted === correct) {
      // ✅ SUCCESS FLOW - Codeforces-style time-based scoring
      // score = max(0.3 * points, points - points/250 * time_in_minutes)
      const basePoints = question.points || 10;

      // Calculate time from event start and apply Codeforces-style scoring
      const gameSettings = await GameSettings.findOne();
      let pointsAwarded = 0;
      
      if (gameSettings && gameSettings.isStarted && gameSettings.startTime) {
        const eventStartTime = new Date(gameSettings.startTime).getTime();
        const currentTime = Date.now();
        const elapsedTimeInSeconds = Math.floor((currentTime - eventStartTime) / 1000);
        const elapsedTimeInMinutes = elapsedTimeInSeconds / 60;
        
        // Codeforces-style scoring: faster solvers get more points
        pointsAwarded = calculateCodeforcesScore(basePoints, elapsedTimeInMinutes);
      } else {
        // If game not started, use base points
        pointsAwarded = basePoints;
      }

      team.score += pointsAwarded;
      team.currentStep += 1; // ADVANCE STEP
      team.category = pickNewCategory(team.category);
      await team.save();

      await ScanLog.create({
        teamId: team._id,
        locationId: location._id,
        isCorrect: true,
        pointsAwarded
      });

      // Check if finished
      const maxOrderDoc = await Location.findOne().sort({ order: -1 }).select("order");
      const totalLocations = maxOrderDoc ? maxOrderDoc.order : 0;
      const isFinished = team.currentStep > totalLocations;

      // Fetch next clue (if any) for immediate display
      const nextClueDoc = await Clue.findOne({ step: team.currentStep, category: team.category })
        || await Clue.findOne({ step: team.currentStep, category: "ALL" });

      res.json({
        message: "Access Granted. Protocol Advanced.",
        score: team.score,
        nextStep: team.currentStep,
        isFinished,
        category: team.category,
        pointsAwarded,
        nextClue: nextClueDoc
          ? { text: nextClueDoc.text, imageUrl: nextClueDoc.imageUrl || null }
          : null
      });

    } else {
      // ❌ FAILURE FLOW (no penalty, cooldown only)
      team.lastWrongScanTime = new Date();
      await team.save();

      await ScanLog.create({
        teamId: team._id,
        locationId: location._id,
        isCorrect: false
      });

      res.status(400).json({
        message: "Decryption Failed. Try again.",
        remainingSeconds: SCAN_COOLDOWN / 1000
      });
    }
  } catch (error) {
    console.error("Verify answer error:", error);
    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};