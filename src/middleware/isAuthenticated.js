import jwt from "jsonwebtoken";
import Student from "../model/StudentModel/student.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    // ==========================================
    // Get Token
    // ==========================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    const token = authHeader.split(" ")[1];

    // ==========================================
    // Verify Token
    // ==========================================

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // ==========================================
    // Find Student
    // ==========================================

    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive.",
      });
    }

    if (student.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account has been blocked.",
      });
    }

    // ==========================================
    // Store Student
    // ==========================================

    req.student = student;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token.",
    });
  }
};
