import Question from "../models/Question.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { MAX_QUESTIONS, TIME_PENALTY_PER_SEC } from "../utils/scoring.js";
import Team from "../models/Team.js";

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

    const questionIds = answers.map((ans) => ans.questionId).filter(Boolean);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let score = 0;

    for (const ans of answers) {
      const question = questionMap.get(String(ans.questionId));
      if (!question) continue;
      const submitted = String(ans.answer || "").trim().toLowerCase();
      const correct = String(question.correctAnswer || "").trim().toLowerCase();
      if (submitted && submitted === correct) {
        score += question.points;
      }
    }

    // ⏱ Time-based deduction
    score -= timeTaken * TIME_PENALTY_PER_SEC;
    score = Math.max(0, Math.round(score));

    // Update team score
    team.score += score;
    await team.save();

    await QuizAttempt.create({
      teamId: team._id,
      step,
      scoreEarned: score,
      timeTaken
    });

    res.json({
      message: "Quiz submitted successfully",
      scoreEarned: score,
      totalScore: team.score
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
