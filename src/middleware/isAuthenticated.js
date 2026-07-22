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
        code: 401,
        message: "Token expired",
      });
    }

    // ==========================================
    // Verify Token
    // ==========================================

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Token expired",
      });
    }

    // ==========================================
    // Find Student
    // ==========================================

    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Token expired",
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
        code: 401,
        message: "Token expired",
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
      code: 401,
      message: "Token expired",
    });
  }
};