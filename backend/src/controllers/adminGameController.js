import Team from "../models/Team.js";
import Location from "../models/Location.js";
import Question from "../models/Question.js";
import ScanLog from "../models/ScanLog.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Clue from "../models/Clue.js";
import Hint from "../models/Hint.js";
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

    // Reset team progress but keep them on the event's startTime
    // Don't override startTime - use global event start time for scoring
    await Team.findByIdAndUpdate(teamId, {
      score: 0,
      penalties: 0,
      currentStep: 1,
      lastWrongScanTime: null
    });

    // Clear all previous attempts and scans
    await ScanLog.deleteMany({ teamId });
    await QuizAttempt.deleteMany({ teamId });

    res.json({ message: "Team reset successfully. Progress cleared." });
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

/* GLOBAL LEADERBOARD */
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Team.find()
      .sort({ score: -1, penalties: 1, startTime: 1 })
      .select("-password");

    res.json(leaderboard);
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

export const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ order: 1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, order, category, pdfContent, answer } = req.body;
    const location = await Location.findByIdAndUpdate(
      id,
      { code, order, category, pdfContent, answer },
      { new: true }
    );
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByIdAndDelete(id);
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { step, category, question, correctAnswer, points, imageUrl, imageBase64, image } = req.body;
    const options = parseOptions(req.body.options);
    
    // Priority: uploaded file > base64 > URL from body
    let finalImageUrl = null;
    if (req.file) {
      finalImageUrl = fileToBase64(req.file);
    } else if (imageBase64 || image) {
      finalImageUrl = imageBase64 || image;
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
    const { step, category, text, imageUrl, imageBase64, image } = req.body;
    
    // Priority: uploaded file > base64 > URL from body
    let finalImageUrl = null;
    if (req.file) {
      finalImageUrl = fileToBase64(req.file);
    } else if (imageBase64 || image) {
      finalImageUrl = imageBase64 || image;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    }
    
    const stepValue = Number(step);
    const categoryValue = category || "ALL";

    const existing = await Clue.findOne({ step: stepValue, category: categoryValue });
    if (existing) {
      existing.text = text;
      if (finalImageUrl) {
        existing.imageUrl = finalImageUrl;
      }
      await existing.save();
      return res.status(200).json(existing);
    }

    const clue = await Clue.create({
      step: stepValue,
      category: categoryValue,
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
    } else if (update.imageBase64 || update.image) {
      update.imageUrl = update.imageBase64 || update.image;
    } else if (!update.imageUrl) {
      // Don't update imageUrl if not provided
      delete update.imageUrl;
    }

    delete update.image;
    delete update.imageBase64;
    
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

/* TEAM APPROVAL SYSTEM */
export const getPendingTeams = async (req, res) => {
  try {
    const pendingTeams = await Team.find({ isApproved: false }).select("-password");
    res.json(pendingTeams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    team.isApproved = true;
    team.approvedBy = req.admin._id;
    team.approvedAt = new Date();
    await team.save();

    res.json({
      message: "Team approved successfully",
      team: {
        _id: team._id,
        name: team.name,
        isApproved: team.isApproved,
        approvedAt: team.approvedAt
      }
    });
  } catch (error) {
    console.error("Approve Team Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const rejectTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByIdAndDelete(id);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      message: "Team rejected and removed from system",
      teamName: team.name
    });
  } catch (error) {
    console.error("Reject Team Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* HINT MANAGEMENT */
export const createHint = async (req, res) => {
  try {
    const { step, category, title, content } = req.body;
    
    if (!step || !category || !title || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hint = await Hint.create({
      step: Number(step),
      category,
      title,
      content,
      createdBy: req.admin._id,
      isActive: true
    });

    res.status(201).json({ message: "Hint created successfully", hint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHints = async (req, res) => {
  try {
    const hints = await Hint.find().sort({ step: 1, createdAt: -1 });
    res.json(hints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;

    const hint = await Hint.findByIdAndUpdate(
      id,
      { title, content, isActive },
      { new: true }
    );

    if (!hint) {
      return res.status(404).json({ message: "Hint not found" });
    }

    res.json({ message: "Hint updated successfully", hint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHint = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedHint = await Hint.findByIdAndDelete(id);
    
    if (!deletedHint) {
      return res.status(404).json({ message: "Hint not found" });
    }

    res.json({ message: "Hint deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
