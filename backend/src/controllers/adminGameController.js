import Team from "../models/Team.js";
import Location from "../models/Location.js";
import Question from "../models/Question.js";
import ScanLog from "../models/ScanLog.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Clue from "../models/Clue.js";
import GameSettings from "../models/GameSettings.js";
import { fileToBase64 } from "../utils/upload.js";

const parseOptions = (options) => {
  if (!options) return [];
  if (Array.isArray(options)) return options.filter(Boolean);
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return options
        .split(/\r?\n|\s*,\s*/)
        .map((opt) => opt.trim())
        .filter(Boolean);
    }
  }
  return [];
};

/* GLOBAL GAME CONTROLS */
export const getGameStatus = async (req, res) => {
  try {
    let settings = await GameSettings.findOne();
    if (!settings) settings = await GameSettings.create({});
    res.json({
      ...settings.toObject(),
      serverTime: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleGame = async (req, res) => {
  try {
    const { action, eventDurationMinutes } = req.body; // 'start', 'pause', 'stop' + duration
    console.log(`[GAME CONTROL] Action: ${action}`);

    let settings = await GameSettings.findOne();
    if (!settings) {
      console.log("[GAME CONTROL] Creating initial settings");
      settings = await GameSettings.create({});
    }

    if (action === 'start') {
      const startTime = new Date();
      const duration = eventDurationMinutes || settings.eventDurationMinutes || 120;
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      settings.isStarted = true;
      settings.isPaused = false;
      settings.startTime = startTime;
      settings.eventDurationMinutes = duration;
      settings.endTime = endTime;
      console.log(`[GAME CONTROL] Starting event at: ${startTime}, duration: ${duration}min, ends: ${endTime}`);
      
      // Update ALL teams to start from now when the event begins
      const result = await Team.updateMany({}, { startTime: startTime });
      console.log(`[GAME CONTROL] Updated ${result.modifiedCount} teams with start time`);
    } else if (action === 'pause') {
      settings.isPaused = !settings.isPaused;
      console.log(`[GAME CONTROL] Event ${settings.isPaused ? 'paused' : 'resumed'}`);
    } else if (action === 'stop') {
      settings.isStarted = false;
      console.log("[GAME CONTROL] Event stopped");
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("TOGGLE GAME ERROR:", error);
    res.status(500).json({ message: error.message || "Internal server error during game control" });
  }
};

/* TEAM MANAGEMENT */
export const removePenalty = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    
    team.penalties = Math.max(0, team.penalties - 1); // Remove one penalty at a time or all? Let's say one.
    await team.save();
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adjustTime = async (req, res) => {
  try {
    const { minutes } = req.body; // positive to add time (makes them 'older'), negative to reduce
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Adjusting startTime: 
    // If we add 5 minutes to their "played time", we move their startTime 5 minutes BACK.
    const currentStart = new Date(team.startTime).getTime();
    team.startTime = new Date(currentStart - (minutes * 60000));
    
    await team.save();
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetTeam = async (req, res) => {
  try {
    const teamId = req.params.id;

    await Team.findByIdAndUpdate(teamId, {
      score: 0,
      penalties: 0,
      currentStep: 1,
      startTime: new Date()
    });

    await ScanLog.deleteMany({ teamId });
    await QuizAttempt.deleteMany({ teamId });

    res.json({ message: "Team reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    await Team.findByIdAndDelete(teamId);
    await ScanLog.deleteMany({ teamId });
    await QuizAttempt.deleteMany({ teamId });
    res.json({ message: "Team removed from event" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* CATEGORY-WISE LEADERBOARD */
export const getLeaderboard = async (req, res) => {
  try {
    const categories = ["A", "B", "C", "D", "E"];
    const groupedLeaderboard = {};

    for (const cat of categories) {
      groupedLeaderboard[cat] = await Team.find({ category: cat })
        .sort({ score: -1, penalties: 1, startTime: 1 })
        .select("-password");
    }

    res.json(groupedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  // Return top N qualifiers per category (default top 2)
  export const getQualifiers = async (req, res) => {
    try {
      const topN = Number(req.query.top) || 2;
      const categories = ["A", "B", "C", "D", "E"];
      const qualifiers = {};

      for (const cat of categories) {
        qualifiers[cat] = await Team.find({ category: cat })
          .sort({ score: -1, penalties: 1, startTime: 1 })
          .limit(topN)
          .select("name score category currentStep");
      }

      res.json({ qualifiers, topN });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

/* REST OF FUNCTIONS */
export const createLocation = async (req, res) => {
  try {
    const { code, order, category, pdfContent, answer } = req.body;
    const location = await Location.create({ code, order, category, pdfContent, answer });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { step, category, question, correctAnswer, points, imageUrl, imageBase64 } = req.body;
    const options = parseOptions(req.body.options);
    
    // Priority: uploaded file > base64 > URL from body
    let finalImageUrl = null;
    if (req.file) {
      finalImageUrl = fileToBase64(req.file);
    } else if (imageBase64) {
      // Store base64 directly
      finalImageUrl = imageBase64;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    }
    
    const created = await Question.create({
      step: Number(step),
      category: category || "ALL",
      question,
      options,
      correctAnswer,
      points: points ? Number(points) : 10,
      imageUrl: finalImageUrl
    });
    res.status(201).json(created);
  } catch (error) {
    console.error("Create Question Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createClue = async (req, res) => {
  try {
    const { step, category, text, imageUrl, imageBase64 } = req.body;
    
    // Priority: uploaded file > base64 > URL from body
    let finalImageUrl = null;
    if (req.file) {
      finalImageUrl = fileToBase64(req.file);
    } else if (imageBase64) {
      // Store base64 directly
      finalImageUrl = imageBase64;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    }
    
    const clue = await Clue.create({
      step: Number(step),
      category: category || "ALL",
      text,
      imageUrl: finalImageUrl
    });
    res.status(201).json(clue);
  } catch (error) {
    console.error("Create Clue Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Clue for this step and category already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getAllClues = async (req, res) => {
  try {
    const clues = await Clue.find().sort({ step: 1, category: 1 });
    res.json(clues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateClue = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    if (update.step) update.step = Number(update.step);
    
    // Use uploaded file if available, otherwise keep existing or use provided URL
    if (req.file) {
      update.imageUrl = fileToBase64(req.file);
    } else if (!update.imageUrl) {
      // Don't update imageUrl if not provided
      delete update.imageUrl;
    }
    
    const updatedClue = await Clue.findByIdAndUpdate(id, update, { new: true });
    if (!updatedClue) return res.status(404).json({ message: "Clue not found" });
    res.json(updatedClue);
  } catch (error) {
    console.error("Update Clue Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteClue = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedClue = await Clue.findByIdAndDelete(id);
    if (!deletedClue) return res.status(404).json({ message: "Clue not found" });
    res.json({ message: "Clue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().select("-password");
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ step: 1, category: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

