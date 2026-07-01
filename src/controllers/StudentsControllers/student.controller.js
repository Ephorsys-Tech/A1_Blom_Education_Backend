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

export const registerStudent = async (req, res) => {
  try {
    const student = await registerStudentService(req.body);

    return res.status(201).json({
      success: true,
      message: "Student Registered Successfully. OTP sent to your mobile.",
      student,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Verify Mobile OTP
// ==========================================

export const verifyMobileOTP = async (req, res) => {
  try {
    const result = await verifyMobileOTPService(req.body);

    return res.status(200).json({
      success: true,
      message: "Mobile verified successfully.",
      result,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Resend Mobile OTP
// ==========================================

export const resendMobileOTP = async (req, res) => {
  try {
    await resendMobileOTPService(req.body);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Login Student
// ==========================================

export const loginStudent = async (req, res) => {
  try {
    const result = await loginStudentService(req.body);

    return res.status(200).json({
      success: true,
      message: "Login Successfully.",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      student: result.student,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET MY PROFILE CONTROLLER
// ==========================================

export const getMyProfile = async (req, res) => {
  try {
    const student = await getMyProfileService(req.student._id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      student,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// UPDATE PROFILE CONTROLLER
// ==========================================

export const updateProfile = async (req, res) => {
  try {
    const student = await updateProfileService(req.student._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      student,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// LOGOUT CONTROLLER
// ==========================================

export const logoutStudent = async (req, res) => {
  try {
    await logoutStudentService(req.student._id);

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// REQUEST DELETE ACCOUNT OTP CONTROLLER
// ==========================================

export const requestDeleteAccountOTP = async (req, res) => {
  try {
    await requestDeleteAccountOTPService(req.student._id);

    return res.status(200).json({
      success: true,
      message: "OTP sent for account deletion.",
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// CONFIRM DELETE ACCOUNT CONTROLLER
// ==========================================

export const confirmDeleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;

    await confirmDeleteAccountService(req.student._id, otp);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
