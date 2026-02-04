import jwt from "jsonwebtoken";
import Team from "../models/Team.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not defined!");
        return res.status(500).json({ message: "Server configuration error" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.team = await Team.findById(decoded.id).select("-password");

      if (!req.team) {
        console.error("Team not found for ID:", decoded.id);
        return res.status(401).json({ message: "Unauthorized - Team not found" });
      }

      if (!req.team.isActive) {
        console.error("Team is inactive:", req.team.name);
        return res.status(401).json({ message: "Unauthorized - Team inactive" });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token expired. Please login again." });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token. Please login again." });
      }
      return res.status(401).json({ message: "Authentication failed" });
    }
  } else {
    console.error("No authorization header provided");
    return res.status(401).json({ message: "No token provided" });
  }
};
