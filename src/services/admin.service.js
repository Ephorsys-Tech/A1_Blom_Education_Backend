import AdminModel from "../model/admin.model.js";
import { sendMail } from "../utils/sendMail.js";
import { managerAccessTemplate } from "../utils/mailTemplates/managerAccessTemplate.js";
import { generateAdminAccessToken } from "../utils/generateAccessToken.js";
import { generateAdminRefreshToken } from "../utils/generateRefreshToken.js";
import jwt from "jsonwebtoken";

// ======================================================
// REGISTER ADMIN SERVICE
// ======================================================
export const registerAdminService = async (data) => {
  const { name, email, password } = data;

  if (!name || !email || !password) {
    const error = new Error("All Fields are Required");
    error.statusCode = 400;
    throw error;
  }

  const existingAdmin = await AdminModel.findOne({ email });
  if (existingAdmin) {
    const error = new Error("Admin Already Exists");
    error.statusCode = 409;
    throw error;
  }

  const admin = await AdminModel.create({
    name,
    email,
    password,
  });

  const adminData = await AdminModel.findById(admin._id).select("-password");
  return adminData;
};

// ======================================================
// LOGIN ADMIN SERVICE
// ======================================================
export const loginAdminService = async (data) => {
  const { email, userId, password } = data;

  let admin;
  let loginMethod = "";

  if (email) {
    admin = await AdminModel.findOne({ email });
    loginMethod = "email";
  } else if (userId) {
    admin = await AdminModel.findOne({ userId });
    loginMethod = "userId";
  }

  if (!admin) {
    const error = new Error("Admin or Manager Not Found");
    error.statusCode = 404;
    throw error;
  }

  if (admin.role === "admin" && loginMethod !== "email") {
    const error = new Error("Admin can only login using email address.");
    error.statusCode = 400;
    throw error;
  }

  if (admin.isBlocked) {
    const error = new Error("Account is blocked. Please contact the main admin.");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    const error = new Error("Invalid Credentials");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAdminAccessToken(admin);
  const refreshToken = generateAdminRefreshToken(admin._id);

  admin.refreshToken = refreshToken;
  await admin.save();

  return {
    accessToken,
    refreshToken,
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
};

// ======================================================
// LOGOUT ADMIN SERVICE
// ======================================================
export const logoutAdminService = async (token) => {
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      await AdminModel.findByIdAndUpdate(decoded.id, { refreshToken: "" });
    } catch (err) {
      // Ignore invalid or expired token errors during logout
    }
  }
};

// ======================================================
// REFRESH ADMIN TOKEN SERVICE
// ======================================================
export const refreshAdminTokenService = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    const error = new Error("Refresh token is required.");
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    const err = new Error("Invalid or expired refresh token.");
    err.statusCode = 401;
    err.code = "INVALID_REFRESH_TOKEN";
    throw err;
  }

  const admin = await AdminModel.findById(decoded.id).select("+refreshToken");
  if (!admin) {
    const error = new Error("Admin or Manager not found.");
    error.statusCode = 401;
    throw error;
  }

  if (admin.isBlocked) {
    const error = new Error("Account is blocked. Please contact the main admin.");
    error.statusCode = 403;
    throw error;
  }

  if (!admin.refreshToken || admin.refreshToken !== incomingRefreshToken) {
    const error = new Error("Session has expired or token is invalid.");
    error.statusCode = 401;
    error.code = "INVALID_REFRESH_TOKEN";
    throw error;
  }

  const accessToken = generateAdminAccessToken(admin);
  const refreshToken = generateAdminRefreshToken(admin._id);

  admin.refreshToken = refreshToken;
  await admin.save();

  return {
    accessToken,
    refreshToken,
  };
};

// ======================================================
// GET ADMIN PROFILE SERVICE
// ======================================================
export const getAdminProfileService = async (adminId) => {
  const admin = await AdminModel.findById(adminId).select("-password");
  if (!admin) {
    const error = new Error("Admin Not Found");
    error.statusCode = 404;
    throw error;
  }
  return admin;
};

// ======================================================
// FORGOT PASSWORD SERVICE
// ======================================================
export const forgotPasswordService = async (email) => {
  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  const admin = await AdminModel.findOne({ email });
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  admin.resetOtp = otp;
  admin.resetOtpExpire = Date.now() + 10 * 60 * 1000;
  await admin.save();

  // Return the OTP in case email templates are skipped or for dev debugging
  return otp;
};

// ======================================================
// RESET PASSWORD SERVICE
// ======================================================
export const resetPasswordService = async (data) => {
  const { email, otp, password, confirmPassword } = data;

  if (!email || !otp || !password || !confirmPassword) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  if (password !== confirmPassword) {
    const error = new Error("Password and Confirm Password must match");
    error.statusCode = 400;
    throw error;
  }

  const admin = await AdminModel.findOne({ email });
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }

  if (admin.resetOtp !== otp) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  if (!admin.resetOtpExpire || admin.resetOtpExpire < Date.now()) {
    const error = new Error("OTP expired");
    error.statusCode = 400;
    throw error;
  }

  admin.password = password;
  admin.resetOtp = undefined;
  admin.resetOtpExpire = undefined;
  await admin.save();
};

// ======================================================
// GIVE ACCESS SERVICE (CREATE MANAGERS)
// ======================================================
export const giveAccessService = async (requesterRole, data) => {
  if (requesterRole !== "admin") {
    const error = new Error("Access Denied: Only Admin can perform this action");
    error.statusCode = 403;
    throw error;
  }

  const { name, email, password, role, userId } = data;

  if (!name || !email || !password || !role || !userId) {
    const error = new Error("All fields are required (name, email, password, role, userId)");
    error.statusCode = 400;
    throw error;
  }

  const validRoles = ["web-manager", "app-manager"];
  if (!validRoles.includes(role)) {
    const error = new Error("Invalid role. Must be 'web-manager' or 'app-manager'");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await AdminModel.findOne({ 
    $or: [{ email }, { userId }] 
  });
  if (existingUser) {
    const error = new Error("User with this email or User ID already exists");
    error.statusCode = 409;
    throw error;
  }

  const manager = await AdminModel.create({
    name,
    email,
    password,
    role,
    userId,
  });

  const managerData = await AdminModel.findById(manager._id).select("-password");

  // Send access email
  const { emailSubject, emailHtml } = managerAccessTemplate(role, name, userId, email, password);
  try {
    await sendMail(email, emailSubject, emailHtml);
  } catch (mailError) {
    console.error("Mail dispatch failed in giveAccessService, continuing:", mailError.message);
  }

  return managerData;
};

// ======================================================
// GET ALL MANAGERS SERVICE
// ======================================================
export const getAllManagersService = async (requesterRole) => {
  if (requesterRole !== "admin") {
    const error = new Error("Access Denied");
    error.statusCode = 403;
    throw error;
  }

  const managers = await AdminModel.find({ 
    role: { $in: ["web-manager", "app-manager"] } 
  }).select("-password");

  return managers;
};

// ======================================================
// TOGGLE BLOCK MANAGER SERVICE
// ======================================================
export const toggleBlockManagerService = async (requesterRole, managerId) => {
  if (requesterRole !== "admin") {
    const error = new Error("Access Denied");
    error.statusCode = 403;
    throw error;
  }

  const manager = await AdminModel.findById(managerId);
  if (!manager || manager.role === "admin") {
    const error = new Error("Manager not found");
    error.statusCode = 404;
    throw error;
  }

  manager.isBlocked = !manager.isBlocked;
  await manager.save();

  return manager;
};

// ======================================================
// DELETE MANAGER SERVICE
// ======================================================
export const deleteManagerService = async (requesterRole, managerId) => {
  if (requesterRole !== "admin") {
    const error = new Error("Access Denied");
    error.statusCode = 403;
    throw error;
  }

  const manager = await AdminModel.findByIdAndDelete(managerId);
  if (!manager) {
    const error = new Error("Manager not found");
    error.statusCode = 404;
    throw error;
  }
};
