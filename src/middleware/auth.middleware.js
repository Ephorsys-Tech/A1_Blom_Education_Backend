import jwt from "jsonwebtoken";
import AdminModel from "../model/admin.model.js";
import redis from "../config/redis.config.js";
import logger from "../config/logger.js";

const protect = async (req, res, next) => {
  try {
    // ---------------------------------------------
    // Get Token From Cookies or Authorization Header
    // ---------------------------------------------
    let token = req.cookies.accessToken || req.cookies.token;

    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized",
      });
    }

    // ----------------------------------------------
    // Verify Token
    // ----------------------------------------------
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
        message: "Invalid Token",
      });
    }

    // ----------------------------------------------
    // Find Admin
    // ----------------------------------------------
    const cacheKey = `cache:admin:id:${decoded.id}`;
    let admin;

    if (redis && redis.status === 'ready') {
      try {
        const cachedAdmin = await redis.get(cacheKey);
        if (cachedAdmin) {
          admin = JSON.parse(cachedAdmin);
          logger.info(`Session cache hit for admin ID: ${decoded.id}`);
        }
      } catch (err) {
        logger.error(`Error reading admin session from Redis:`, err);
      }
    }

    if (!admin) {
      admin = await AdminModel.findById(decoded.id).select("-password");
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin or Manager not found.",
        });
      }

      if (redis && redis.status === 'ready') {
        try {
          // Cache session for 10 minutes
          await redis.set(cacheKey, JSON.stringify(admin), 'EX', 600);
          logger.info(`Session cache miss for admin ID: ${decoded.id}. Cached in Redis.`);
        } catch (err) {
          logger.error(`Error writing admin session to Redis:`, err);
        }
      }
    }

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked. Please contact the main admin.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized",
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Role '${req.admin.role}' does not have permission to perform this action`,
      });
    }

    next();
  };
};

export default protect;
