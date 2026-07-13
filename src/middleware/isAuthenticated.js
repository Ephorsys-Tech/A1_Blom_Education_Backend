import jwt from "jsonwebtoken";
import Student from "../model/appModel/student.model.js";
import redis from "../config/redis.config.js";
import logger from "../config/logger.js";

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
    // Verify Token (separated so we can tell
    // "expired" apart from "invalid/tampered")
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

    const cacheKey = `cache:student:id:${decoded.id}`;
    let student;

    if (redis && redis.status === "ready") {
      try {
        const cachedStudent = await redis.get(cacheKey);
        if (cachedStudent) {
          student = JSON.parse(cachedStudent);
          logger.info(`Session cache hit for student ID: ${decoded.id}`);
        }
      } catch (err) {
        logger.error("Error retrieving student from Redis cache:", err);
      }
    }

    if (!student) {
      student = await Student.findById(decoded.id);

      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not found.",
        });
      }

      if (redis && redis.status === "ready") {
        try {
          // Cache student profile for 15 minutes (900 seconds)
          await redis.set(cacheKey, JSON.stringify(student), "EX", 900);
          logger.info(`Session cache miss for student ID: ${decoded.id}. Cached in Redis.`);
        } catch (err) {
          logger.error("Error saving student to Redis cache:", err);
        }
      }
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
    // Check Token Version
    // (catches tokens issued before a logout /
    // password change / forced revoke bumped
    // tokenVersion — kills them even if the JWT
    // itself hasn't naturally expired yet)
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
