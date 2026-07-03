import express from "express";
import {
  uploadVideo,
  deleteVideo,
  getAllVideos,
  getPublicVideos,
  toggleVideoStatus,
} from "../../controllers/webController/video.controller.js";
import protect from "../../middleware/auth.middleware.js";

const router = express.Router();

// Get public videos - accessible to anyone
router.get("/public", getPublicVideos);

// Get all videos - protected so only logged in users (or admin) can view
router.get("/", protect, getAllVideos);

// Admin routes for video management
router.post("/upload", protect, uploadVideo);
router.delete("/:id", protect, deleteVideo);
router.put("/toggle/:id", protect, toggleVideoStatus);

export default router;
