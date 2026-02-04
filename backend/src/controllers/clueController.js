import Clue from "../models/Clue.js";

export const getClue = async (req, res) => {
  try {
    const team = req.team;

    // Try category-specific clue first, then fallback to 'ALL'
    let clue = await Clue.findOne({ step: team.currentStep, category: team.category });
    if (!clue) {
      clue = await Clue.findOne({ step: team.currentStep, category: "ALL" });
    }

    if (!clue) {
      return res.status(404).json({ message: "Clue not available yet for your division. Check back soon." });
    }

    res.json({
      step: team.currentStep,
      clue: clue.text,
      text: clue.text,  // Add this for consistency with nextClue structure
      imageUrl: clue.imageUrl || null
    });
  } catch (error) {
    console.error("Get clue error:", error);
    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};
