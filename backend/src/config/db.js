import mongoose from "mongoose";

let cachedConnection = null;

const connectDB = async () => {
  try {
    // Return cached connection if already connected
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log("✓ Using cached MongoDB connection");
      return cachedConnection;
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("🔗 Attempting to connect to MongoDB...");
    
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 3,
      minPoolSize: 0,
      retryWrites: true,
      family: 4,
      authSource: "admin",
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    
    cachedConnection = conn;
    console.log("✓ MongoDB connected successfully");
    
    return conn;
  } catch (error) {
    console.error("✗ MongoDB Connection Error:", error.message);
    
    // For serverless: don't exit, just log and let the request fail gracefully
    if (process.env.NODE_ENV === "development") {
      process.exit(1);
    }
    
    throw error;
  }
};

export default connectDB;