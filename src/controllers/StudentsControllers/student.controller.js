import asyncHandler from "../../middleware/asyncHandler.js";
import Student from "../../model/StudentModel/student.model.js";
import {
  confirmDeleteAccountService,
  getMyProfileService,
  loginStudentService,
  logoutStudentService,
  registerStudentService,
  requestDeleteAccountOTPService,
  resendMobileOTPService,
  updateProfileService,
  verifyMobileOTPService,
} from "../../services/student.service.js";

// ==========================================
// Register Student
// ==========================================

export const registerStudent = asyncHandler(async (req, res) => {
  const student = await registerStudentService(req.body);

  return res.status(201).json({
    success: true,
    message: "Student Registered Successfully. OTP sent to your mobile.",
    student,
  });
});

// ==========================================
// Verify Mobile OTP
// ==========================================

export const verifyMobileOTP = asyncHandler(async (req, res) => {
  const result = await verifyMobileOTPService(req.body);

  res.status(200).json({
    success: true,
    message: "Mobile verified successfully.",
    result,
  });
});

// ==========================================
// Resend Mobile OTP
// ==========================================

export const resendMobileOTP = asyncHandler(async (req, res) => {
  await resendMobileOTPService(req.body);

  res.status(200).json({
    success: true,
    message: "OTP sent successfully.",
  });
});

// ==========================================
// Login Student
// ==========================================

export const loginStudent = asyncHandler(async (req, res) => {
  const result = await loginStudentService(req.body);

  return res.status(200).json({
    success: true,
    message: "Login Successfully.",
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    student: result.student,
  });
});

// ==========================================
// GET MY PROFILE CONTROLLER
// ==========================================

export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await getMyProfileService(req.student._id);

  return res.status(200).json({
    success: true,
    message: "Profile fetched successfully.",
    student,
  });
});

// ==========================================
// UPDATE PROFILE CONTROLLER
// ==========================================

export const updateProfile = asyncHandler(async (req, res) => {
  const student = await updateProfileService(req.student._id, req.body);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    student,
  });
});

// ==========================================
// LOGOUT CONTROLLER
// ==========================================

export const logoutStudent = asyncHandler(async (req, res) => {
  await logoutStudentService(req.student._id);

  return res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
});

// ==========================================
// REQUEST DELETE OTP
// ==========================================

export const requestDeleteAccountOTP = asyncHandler(async (req, res) => {
  await requestDeleteAccountOTPService(req.student._id);

  return res.status(200).json({
    success: true,
    message: "OTP sent for account deletion.",
  });
});

// ==========================================
// CONFIRM DELETE ACCOUNT
// ==========================================

export const confirmDeleteAccount = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  await confirmDeleteAccountService(req.student._id, otp);

  return res.status(200).json({
    success: true,
    message: "Account deleted successfully.",
  });
});
