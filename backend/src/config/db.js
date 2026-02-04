import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("✓ MongoDB already connected");
      return;
    }
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    // Serverless-optimized connection options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Limit connection pool
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
    });
    
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB Error:", error.message);
    // Don't exit in production/serverless - let it retry
    if (process.env.NODE_ENV === "development") {
      process.exit(1);
    }
  }
};

export default connectDB;