import express from "express";
import { uploadVideo, deleteVideo, getAllVideos } from "../controllers/video.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all videos - protected so only logged in users (or admin) can view
router.get("/", protect, getAllVideos);

// Admin routes for video management
// Since auth.middleware.js verifies AdminModel, protect ensures the user is an Admin
router.post("/upload", protect, uploadVideo);
router.delete("/:id", protect, deleteVideo);

export default router;
