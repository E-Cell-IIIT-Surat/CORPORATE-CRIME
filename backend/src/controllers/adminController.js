import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Try bcrypt first, fall back to plain text
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, admin.password);
    } catch (bcryptErr) {
      // If bcrypt fails, try plain text comparison
      isMatch = password === admin.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      token: generateToken(admin._id),
      role: "admin"
    });
  } catch (error) {
    console.error("🔴 Admin Login Error:", error);
    res.status(500).json({ message: error.message || "Login failed" });
  }
};
