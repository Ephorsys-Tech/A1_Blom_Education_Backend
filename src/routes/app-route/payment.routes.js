import express from "express";
import {
  createOrder,
  verifyPayment,
  enrollStudent,
} from "../../controllers/appController/payment.controller.js";
import { isAuthenticated } from "../../middleware/isAuthenticated.js";

const router = express.Router();

// ==========================================
// Razorpay Payment Routes (Sandbox Enabled)
// ==========================================

// Create Order (POST -> /api/v1/payment/order)
router.post("/order", isAuthenticated, createOrder);

// Verify Payment (POST -> /api/v1/payment/verify)
router.post("/verify", isAuthenticated, verifyPayment);

// Direct Enroll Student (POST -> /api/v1/payment/enroll)
router.post("/enroll", isAuthenticated, enrollStudent);

export default router;
