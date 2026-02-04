import connectDB from "../config/db.js";

export const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(503).json({ 
      message: "Database temporarily unavailable. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
