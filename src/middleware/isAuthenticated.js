import jwt from "jsonwebtoken";
import Student from "../model/appModel/student.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    // ==========================================
    // Get Token
    // ==========================================

    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    // ==========================================
    // Verify Token
    // ==========================================

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Access token expired. Please refresh your session.",
        });
      }

      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid access token.",
      });
    }

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

    // ==========================================
    // Check Token Version
    // ==========================================

    if (decoded.tv !== student.tokenVersion) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Session has been logged out.",
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