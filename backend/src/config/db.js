import mongoose from "mongoose";

let isConnecting = false;
let mongoosePromise = null;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("✓ MongoDB already connected");
      return;
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    // Prevent multiple concurrent connection attempts
    if (isConnecting) {
      return mongoosePromise;
    }

    isConnecting = true;

    mongoosePromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
      minPoolSize: 0,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4 to avoid DNS issues
      authSource: "admin",
    });

    await mongoosePromise;
    isConnecting = false;

    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    isConnecting = false;
    console.error("✗ MongoDB Error:", error.message);

    // Don't exit in production/serverless - let it retry
    if (process.env.NODE_ENV === "development") {
      process.exit(1);
    }
  }
};

export default connectDB;