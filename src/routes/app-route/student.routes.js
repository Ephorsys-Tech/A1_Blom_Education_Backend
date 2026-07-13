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
import { authRateLimiter } from "../../middleware/rateLimiter.middleware.js";


const router = express.Router();


// ==========================================
// Student Authentication
// ==========================================

router.post("/register", authRateLimiter, registerStudent);
router.post("/verify-mobile-otp", authRateLimiter, verifyMobileOTP);
router.post("/resend-mobile-otp", authRateLimiter, resendMobileOTP);
router.post("/verify-email-otp", authRateLimiter, verifyEmailOTP);
router.post("/resend-email-otp", authRateLimiter, resendEmailOTP);
router.post("/login", authRateLimiter, loginStudent);

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
  authRateLimiter,
  requestDeleteAccountOTP,
);

// Step 2: Confirm OTP & Delete
router.delete("/delete-account/confirm", isAuthenticated, authRateLimiter, confirmDeleteAccount);

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
