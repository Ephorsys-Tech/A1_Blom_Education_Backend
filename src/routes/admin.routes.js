import express from "express";
import {
  forgotPassword,
  getAdminProfile,
  giveAccess,
  loginAdmin,
  LogoutAdmin,
  refreshAdminToken,
  registerAdmin,
  verifyAdminEmail,
  resendAdminOtp,
  resetPassword,
  getAllManagers,
  toggleBlockManager,
  deleteManager,
  updateManagerPassword,
} from "../controllers/admin.controller.js";
import protect from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  registerAdminSchema,
  loginAdminSchema,
  refreshAdminTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  giveAccessSchema,
  verifyAdminEmailSchema,
  resendAdminOtpSchema,
  updateManagerPasswordSchema,
} from "../validations/admin.validation.js";
import { paramIdSchema } from "../validations/common.validation.js";

const router = express.Router();

// ------------------------------------------------------
// Admin Authentication Routes
// ------------------------------------------------------

// Register Admin
// POST -> /api/v1/admin/register
router.post("/register", validate({ body: registerAdminSchema }), registerAdmin);

// Verify Admin Email OTP
// POST -> /api/v1/admin/verify-email
router.post("/verify-email", validate({ body: verifyAdminEmailSchema }), verifyAdminEmail);

// Resend Admin Registration OTP
// POST -> /api/v1/admin/resend-otp
router.post("/resend-otp", validate({ body: resendAdminOtpSchema }), resendAdminOtp);

// Login Admin
// POST -> /api/v1/admin/login
router.post("/login", validate({ body: loginAdminSchema }), loginAdmin);

// Logout Admin
// POST -> /api/v1/admin/logout
router.post("/logout", LogoutAdmin);

// Refresh Token
// POST -> /api/v1/admin/refresh-token
router.post("/refresh-token", validate({ body: refreshAdminTokenSchema }), refreshAdminToken);

// ------------------------------------------------------
// Admin Profile
// GET -> /api/v1/admin/profile
// ------------------------------------------------------
router.get("/profile", protect, getAdminProfile);

// ------------------------------------------------------
// Admin Profile
// GET -> /api/v1/admin/forgot-password
// ------------------------------------------------------
router.post("/forgot-password", validate({ body: forgotPasswordSchema }), forgotPassword);

// ------------------------------------------------------
// Admin Profile
// GET -> /api/v1/admin//reset-password
// ------------------------------------------------------
router.post("/reset-password", validate({ body: resetPasswordSchema }), resetPassword);

// ------------------------------------------------------
// Manager creation
// POST -> /api/v1/admin/give-access
// Protect
router.post("/give-access", protect, validate({ body: giveAccessSchema }), giveAccess);

// ----------------------------------------------------
// Get All Manager
// GET -> /api/v1/admin/managers
// Protect
router.get("/managers", protect, getAllManagers);

// ----------------------------------------------------
// Toggle Block Manager
// PATCH -> /api/v1/admin/managers/:id/block
// Protect
router.patch("/managers/:id/block", protect, validate({ params: paramIdSchema }), toggleBlockManager);

// ----------------------------------------------------
// Delete Manager
// DELETE -> /api/v1/admin/managers/:id
// Protect
router.delete("/managers/:id", protect, validate({ params: paramIdSchema }), deleteManager);

// ----------------------------------------------------
// Update Manager Password
// PATCH -> /api/v1/admin/managers/:id/update-password
// Protect
router.patch("/managers/:id/update-password", protect, validate({ params: paramIdSchema, body: updateManagerPasswordSchema }), updateManagerPassword);


export default router;

