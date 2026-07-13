import express from "express";
import adminRoutes from "./admin.routes.js";
import videoRoutes from "./web-route/video.routes.js";
import blogRoutes from "./web-route/blog.routes.js";
import galleryRoutes from "./web-route/gallery.routes.js";
import contactRoutes from "./web-route/contact.routes.js";
import reelRoutes from "./web-route/reel.routes.js";
import announcementRoutes from "./web-route/announcement.routes.js";
import careerRoutes from "./web-route/career.routes.js";
import academicRoutes from "./web-route/academic.routes.js";
import studentRoutes from "./app-route/student.routes.js";
import classesRoutes from "./app-route/classes.route.js";
import subjectsRoutes from "./app-route/subjects.routes.js";
import chapterRoutes from "./app-route/chapter.route.js";
import lectureRoutes from "./app-route/lecture.route.js";

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
// Academic Routes
// ========================================
router.use("/academic", academicRoutes);

// ========================================
// Student Routes
// ========================================
router.use("/student", studentRoutes);

// ========================================
// Classes Routes
// ========================================
router.use("/classes", classesRoutes);

// ========================================
// Subjects Routes
// ========================================
router.use("/subjects", subjectsRoutes);

// ========================================
// Chapter Routes
// ========================================
router.use("/chapters", chapterRoutes);

// ========================================
// Lecture Routes
// ========================================
router.use("/lectures", lectureRoutes);




export default router;
