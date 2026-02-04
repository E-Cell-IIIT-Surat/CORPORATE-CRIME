import bcrypt from "bcryptjs";
import Team from "../models/Team.js";
import Location from "../models/Location.js";
import generateToken from "../utils/generateToken.js";
import GameSettings from "../models/GameSettings.js";

const CATEGORIES = ["A", "B", "C", "D", "E"];

export const registerTeam = async (req, res) => {
  try {
    const { 
      teamName, 
      password, 
      teamLeader, 
      teamLeaderEmail, 
      members 
    } = req.body;

    if (!teamName || !password || !teamLeader || !teamLeaderEmail) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const existingTeam = await Team.findOne({ name: teamName });
    if (existingTeam) {
      return res.status(400).json({ message: "Team name already taken" });
    }

    // 1. Balanced Allocation Algorithm
    const categoryCounts = await Promise.all(
      CATEGORIES.map(async (cat) => ({
        name: cat,
        count: await Team.countDocuments({ category: cat }),
      }))
    );

    const minCount = Math.min(...categoryCounts.map((c) => c.count));
    const bestCategories = categoryCounts
      .filter((c) => c.count === minCount)
      .map((c) => c.name);
    
    const category = bestCategories[Math.floor(Math.random() * bestCategories.length)];

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Create team with approval pending
    const team = await Team.create({
      name: teamName,
      password: hashedPassword,
      category,
      teamLeader,
      teamLeaderEmail,
      members: members || [],
      isApproved: false,
      score: 0,
      currentStep: 1
    });

    res.status(201).json({
      message: "Team registered successfully. Awaiting admin approval.",
      team: {
        _id: team._id,
        name: team.name,
        category: team.category,
        isApproved: team.isApproved
      }
    });
  } catch (error) {
    console.error("🔴 Register Error:", error);
    res.status(500).json({ message: error.message || "Registration failed" });
  }
};

export const teamLogin = async (req, res) => {
  try {
    const { teamName, password } = req.body;
    const team = await Team.findOne({ name: teamName });

    if (!team) {
      return res.status(401).json({ message: "Team not found." });
    }

    // Check if team is approved
    if (!team.isApproved) {
      return res.status(403).json({ 
        message: "Team is awaiting admin approval. Please check back later." 
      });
    }

    // Try bcrypt first, fall back to plain text
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, team.password);
    } catch (bcryptErr) {
      // If bcrypt fails, try plain text comparison
      isMatch = password === team.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      token: generateToken(team._id),
      role: "player",
      team
    });
  } catch (error) {
    console.error("🔴 Login Error:", error);
    res.status(500).json({ message: error.message || "Login failed" });
  }
};

export const getMe = async (req, res) => {
  try {
    const team = req.team;
    // Calculate total steps for the team's category
    const totalSteps = await Location.countDocuments({ 
      category: { $in: [team.category, "ALL"] } 
    });
    
    res.json({
      ...team.toObject(),
      totalSteps
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export const getLeaderboard = async (req, res) => {
    // Global leaderboard only
    try {
      const leaderboard = await Team.find()
        .sort({ score: -1, penalties: 1, startTime: 1 })
        .limit(10)
        .select("name score category currentStep");
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // Returns whether current team is among top N qualifiers for their category
  export const getQualificationStatus = async (req, res) => {
    try {
      const team = req.team;
      const topN = Number(req.query.top) || 2;

      const topTeams = await Team.find({ category: team.category })
        .sort({ score: -1, penalties: 1, startTime: 1 })
        .limit(topN)
        .select("_id name score");

      const qualified = topTeams.some(t => t._id.toString() === team._id.toString());
      const position = topTeams.findIndex(t => t._id.toString() === team._id.toString());

      res.json({ qualified, position: qualified ? position + 1 : null, top: topTeams });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };