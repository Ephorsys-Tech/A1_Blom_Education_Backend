import express from "express";
import {
  confirmDeleteAccount,
  getMyProfile,
  loginStudent,
  logoutStudent,
  registerStudent,
  requestDeleteAccountOTP,
  resendMobileOTP,
  updateProfile,
  verifyMobileOTP,
  enrollStudent,
  refreshAccessToken,
  verifyEmailOTP,
  resendEmailOTP
} from "../../controllers/appController/student.controller.js";
import { isAuthenticated } from "../../middleware/isAuthenticated.js";
import { validate } from "../../middleware/validate.middleware.js";
import { studentUpdateProfile } from "../../validations/student.validation.js";


const router = express.Router();

// ==========================================
// Student Authentication
// ==========================================

router.post("/register", registerStudent);
router.post("/verify-mobile-otp", verifyMobileOTP);
router.post("/resend-mobile-otp", resendMobileOTP);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/resend-email-otp", resendEmailOTP);
router.post("/login", loginStudent);

// ==========================================
// Student Profile Picture
// ==========================================
router.get("/profile", isAuthenticated, getMyProfile);

// ==========================================
// Update Profile
// ==========================================

router.put("/profile", isAuthenticated, validate({ body: studentUpdateProfile }), updateProfile);

// ==========================================
// LogOut Profile
// ==========================================
router.post("/logout", isAuthenticated, logoutStudent);

// Step 1: Send OTP
router.post(
  "/delete-account/request-otp",
  isAuthenticated,
  requestDeleteAccountOTP,
);

// Step 2: Confirm OTP & Delete
router.delete("/delete-account/confirm", isAuthenticated, confirmDeleteAccount);

// ==========================================
// Enrollment Route
// ==========================================
router.post("/enroll", isAuthenticated, enrollStudent);

// ==========================================
// Refresh Access Token
// (Public — no isAuthenticated here, since the
// whole point is that the access token has expired)
// ==========================================
router.post("/refresh-token", refreshAccessToken);

export default router;
