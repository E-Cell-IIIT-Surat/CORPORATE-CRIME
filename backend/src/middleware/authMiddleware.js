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

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.team = await Team.findById(decoded.id).select("-password");

      if (!req.team || !req.team.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};
