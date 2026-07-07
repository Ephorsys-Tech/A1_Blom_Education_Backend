import jwt from "jsonwebtoken";
import AdminModel from "../model/admin.model.js";

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
    const admin = await AdminModel.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin or Manager not found.",
      });
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
