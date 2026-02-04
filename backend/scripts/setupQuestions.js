import mongoose from "mongoose";
import Question from "../src/models/Question.js";
import dotenv from "dotenv";

dotenv.config();

const setupQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Delete all existing questions
    const deletedCount = await Question.deleteMany({});
    console.log(`Deleted ${deletedCount.deletedCount} existing questions`);

    // Insert fresh test questions for each step with simple answers
    const questions = [
      {
        step: 1,
        category: "ALL",
        question: "What is the first step in the cybersecurity challenge?",
        options: ["Start", "Initialization", "Preparation", "Activation"],
        correctAnswer: "Start",
        points: 10
      },
      {
        step: 2,
        category: "ALL",
        question: "What is the second step in the investigation?",
        options: ["Analyze", "Detect", "Investigate", "Process"],
        correctAnswer: "Detect",
        points: 15
      }
    ];

    const inserted = await Question.insertMany(questions);
    console.log(`Inserted ${inserted.length} questions`);

    console.log("Questions setup completed:");
    inserted.forEach(q => {
      console.log(`  - Step ${q.step}: "${q.question}"`);
      console.log(`    Answer: ${q.correctAnswer}`);
    });

    await mongoose.connection.close();
    console.log("Connection closed");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

setupQuestions();
