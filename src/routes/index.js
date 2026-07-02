import express from "express";
import adminRoutes from "../routes/admin.routes.js";
import videoRoutes from "../routes/video.routes.js";
import blogRoutes from "../routes/blog.routes.js";
import galleryRoutes from "../routes/gallery.routes.js";
import contactRoutes from "../routes/contact.routes.js";
import reelRoutes from "../routes/reel.routes.js";
import announcementRoutes from "../routes/announcement.routes.js";
import careerRoutes from "../routes/career.routes.js";
import studentRoutes from "../routes/student.routes.js";
import batchRoutes from "../routes/batch.route.js";

const router = express.Router();

// ========================================
// Admin Routes
// ========================================
router.use("/admin", adminRoutes);

// ========================================
// Video Routes
// ========================================
router.use("/videos", videoRoutes);

// ========================================
// Blog Routes
// ========================================
router.use("/blogs", blogRoutes);

// ========================================
// Gallery Routes
// ========================================
router.use("/gallery", galleryRoutes);

// ========================================
// Contact Routes
// ========================================
router.use("/contact", contactRoutes);

// ========================================
// Reels Routes
// ========================================
router.use("/reels", reelRoutes);

// ========================================
// Announcement Routes
// ========================================
router.use("/announcements", announcementRoutes);

// ========================================
// Career Routes
// ========================================
router.use("/careers", careerRoutes);

// ========================================
// Student Routes
// ========================================
router.use("/student", studentRoutes);

// ========================================
// Batch Routes
// ========================================
router.use("/batches", batchRoutes);

export default router;
