import AdminModel from "../model/admin.model.js";
import { sendMail } from "../utils/sendMail.js";
import { managerAccessTemplate } from "../utils/mailTemplates/managerAccessTemplate.js";
import { managerPasswordUpdateTemplate } from "../utils/mailTemplates/managerPasswordUpdateTemplate.js";
import { generateAdminAccessToken } from "../utils/generateAccessToken.js";
import { generateAdminRefreshToken } from "../utils/generateRefreshToken.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendEmailOTP } from "../utils/sendEmailOTP.js";
import jwt from "jsonwebtoken";
import { deleteCachedData } from "../utils/redisCache.js";

// ======================================================
// REGISTER ADMIN SERVICE
// ======================================================
export const registerAdminService = async (data) => {
  const { name, email, password } = data;

  const existingAdmin = await AdminModel.findOne({ email });
  if (existingAdmin) {
    const error = new Error("Admin Already Exists");
    error.statusCode = 409;
    throw error;
  }

  // Generate email verification OTP
  const otp = generateOTP();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const admin = await AdminModel.create({
    name,
    email,
    password,
    isEmailVerified: false,
    emailVerificationOtp: otp,
    emailVerificationOtpExpire: otpExpire,
  });

  // Send OTP to admin email
  await sendEmailOTP(email, otp);

  const adminData = await AdminModel.findById(admin._id).select("-password");
  return adminData;
};

// ======================================================
// VERIFY ADMIN EMAIL SERVICE
// ======================================================
export const verifyAdminEmailService = async (data) => {
  const { email, otp } = data;

  const admin = await AdminModel.findOne({ email }).select("+emailVerificationOtp +emailVerificationOtpExpire");
  if (!admin) {
    const error = new Error("Admin not found.");
    error.statusCode = 404;
    throw error;
  }

  if (admin.isEmailVerified) {
    const error = new Error("Email is already verified.");
    error.statusCode = 400;
    throw error;
  }

  if (admin.emailVerificationOtp !== otp) {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  if (!admin.emailVerificationOtpExpire || admin.emailVerificationOtpExpire < Date.now()) {
    const error = new Error("OTP has expired. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  admin.isEmailVerified = true;
  admin.emailVerificationOtp = undefined;
  admin.emailVerificationOtpExpire = undefined;
  await admin.save();

  const adminData = await AdminModel.findById(admin._id).select("-password");
  return adminData;
};

// ======================================================
// RESEND ADMIN OTP SERVICE
// ======================================================
export const resendAdminOtpService = async (data) => {
  const { email } = data;

  const admin = await AdminModel.findOne({ email });
  if (!admin) {
    const error = new Error("Admin not found.");
    error.statusCode = 404;
    throw error;
  }

  if (admin.isEmailVerified) {
    const error = new Error("Email is already verified.");
    error.statusCode = 400;
    throw error;
  }

  // Generate new OTP
  const otp = generateOTP();
  admin.emailVerificationOtp = otp;
  admin.emailVerificationOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
  await admin.save();

  // Send OTP to admin email
  await sendEmailOTP(email, otp);
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

  // Block unverified admins from logging in
  if (admin.role === "admin" && !admin.isEmailVerified) {
    const error = new Error("Please verify your email before logging in.");
    error.statusCode = 403;
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
      await deleteCachedData(`cache:admin:id:${decoded.id}`);
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

  // ------------------------------------------
  // Everything checks out → issue a fresh
  // Access Token only. Refresh Token is left
  // untouched so it keeps counting down its
  // own 1-day lifespan.
  // ------------------------------------------
  const newAccessToken = generateAdminAccessToken(admin);

  return { accessToken: newAccessToken };
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
  const admin = await AdminModel.findOne({ email });
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }

  const otp = generateOTP();
  admin.resetOtp = otp;
  admin.resetOtpExpire = Date.now() + 10 * 60 * 1000;
  await admin.save();

  // Send password reset OTP via email
  const subject = "Password Reset OTP - A1 Blom Education";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2563eb; text-align: center;">Password Reset Request</h2>
      <p>Hello ${admin.name},</p>
      <p>Your OTP for password reset is:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">${otp}</span>
      </div>
      <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">© ${new Date().getFullYear()} A1 Blom Education. All rights reserved.</p>
    </div>
  `;
  await sendMail(admin.email, subject, html);
};

// ======================================================
// RESET PASSWORD SERVICE
// ======================================================
export const resetPasswordService = async (data) => {
  const { email, otp, password } = data;

  const admin = await AdminModel.findOne({ email }).select("+resetOtp +resetOtpExpire");
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
  await deleteCachedData(`cache:admin:id:${admin._id}`);
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
  await deleteCachedData(`cache:admin:id:${manager._id}`);

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
  await deleteCachedData(`cache:admin:id:${managerId}`);
};

// ======================================================
// UPDATE MANAGER PASSWORD SERVICE
// ======================================================
export const updateManagerPasswordService = async (requesterRole, managerId, newPassword) => {
  if (requesterRole !== "admin") {
    const error = new Error("Access Denied: Only Admin can perform this action");
    error.statusCode = 403;
    throw error;
  }

  const manager = await AdminModel.findById(managerId);
  if (!manager || manager.role === "admin") {
    const error = new Error("Manager not found");
    error.statusCode = 404;
    throw error;
  }

  manager.password = newPassword;
  await manager.save();
  await deleteCachedData(`cache:admin:id:${manager._id}`);

  // Send email to manager with new password
  const { emailSubject, emailHtml } = managerPasswordUpdateTemplate(
    manager.role,
    manager.name,
    manager.email,
    newPassword
  );

  try {
    await sendMail(manager.email, emailSubject, emailHtml);
  } catch (mailError) {
    console.error("Mail dispatch failed in updateManagerPasswordService, continuing:", mailError.message);
  }
};
