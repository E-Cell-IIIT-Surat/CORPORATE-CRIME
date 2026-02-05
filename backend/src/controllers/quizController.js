import Question from "../models/Question.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { MAX_QUESTIONS, CODEFORCES_MIN_RATIO, CODEFORCES_TIME_DIVISOR } from "../utils/scoring.js";
import Team from "../models/Team.js";
import GameSettings from "../models/GameSettings.js";

// Calculate Codeforces-style score: score = max(0.3 * points, points - points/250 * time_in_minutes)
export const calculateCodeforcesScore = (maxPoints, timeInMinutes) => {
  const minScore = maxPoints * CODEFORCES_MIN_RATIO;
  const timePenalty = (maxPoints / CODEFORCES_TIME_DIVISOR) * timeInMinutes;
  const calculatedScore = maxPoints - timePenalty;
  return Math.max(minScore, Math.round(calculatedScore));
};

export const submitQuiz = async (req, res) => {
  try {
    const team = req.team;
    const { answers, timeTaken } = req.body;
    const step = team.currentStep - 1;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No answers submitted" });
    }

    const alreadyAttempted = await QuizAttempt.findOne({
      teamId: team._id,
      step
    });

    if (alreadyAttempted) {
      return res.status(403).json({ message: "Quiz already submitted" });
    }

    // Get game settings to calculate time from event start
    const gameSettings = await GameSettings.findOne();
    if (!gameSettings || !gameSettings.isStarted || !gameSettings.startTime) {
      return res.status(400).json({ message: "Event has not started" });
    }

    const questionIds = answers.map((ans) => ans.questionId).filter(Boolean);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let totalMaxPoints = 0;
    let correctCount = 0;

    for (const ans of answers) {
      const question = questionMap.get(String(ans.questionId));
      if (!question) continue;
      totalMaxPoints += question.points;
      const submitted = String(ans.answer || "").trim().toLowerCase();
      const correct = String(question.correctAnswer || "").trim().toLowerCase();
      if (submitted && submitted === correct) {
        correctCount++;
      }
    }

    // Only give score if all answers are correct
    let score = 0;
    if (correctCount === answers.length && correctCount > 0) {
      // Calculate time from event start in minutes
      const eventStartTime = new Date(gameSettings.startTime).getTime();
      const currentTime = Date.now();
      const elapsedTimeInSeconds = Math.floor((currentTime - eventStartTime) / 1000);
      const elapsedTimeInMinutes = elapsedTimeInSeconds / 60;

      // Codeforces-style scoring
      score = calculateCodeforcesScore(totalMaxPoints, elapsedTimeInMinutes);
    } else {
      score = 0; // No score if not all answers are correct
    }

    score = Math.max(0, score);

    // Update team score
    team.score += score;
    await team.save();

    await QuizAttempt.create({
      teamId: team._id,
      step,
      scoreEarned: score,
      timeTaken,
      correctAnswers: correctCount,
      totalAnswers: answers.length,
      maxPossiblePoints: totalMaxPoints
    });

    res.json({
      message: "Quiz submitted successfully",
      scoreEarned: score,
      totalScore: team.score,
      correctAnswers: correctCount,
      totalAnswers: answers.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const team = req.team;
    const step = team.currentStep - 1; // quiz for last scanned QR

    // Prevent reattempt
    const alreadyAttempted = await QuizAttempt.findOne({
      teamId: team._id,
      step
    });

    if (alreadyAttempted) {
      return res.status(403).json({ message: "Quiz already attempted" });
    }

    const questions = await Question.aggregate([
      { $match: { step } },
      { $sample: { size: MAX_QUESTIONS } }
    ]);

    res.json({
      step,
      questions: questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        points: q.points,
        imageUrl: q.imageUrl || null
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
