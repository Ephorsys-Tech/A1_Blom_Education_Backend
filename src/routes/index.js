import express from "express";
import adminRoutes from "../routes/admin.routes.js";
import videoRoutes from "../routes/video.routes.js";

const router = express.Router();

// ========================================
// Admin Routes
// ========================================
router.use("/admin", adminRoutes);

// ========================================
// Video Routes
// ========================================
router.use("/videos", videoRoutes);

export default router;
