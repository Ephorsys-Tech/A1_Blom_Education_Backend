import express from "express";
import {
  uploadVideo,
  deleteVideo,
  getAllVideos,
  getPublicVideos,
  toggleVideoStatus,
} from "../../controllers/webController/video.controller.js";
import protect from "../../middleware/auth.middleware.js";
import { cacheMiddleware, invalidateCacheMiddleware } from "../../utils/redisCache.js";

const router = express.Router();

// Get public videos - accessible to anyone
router.get("/public", cacheMiddleware("videos", 300), getPublicVideos);

// Get all videos - protected so only logged in users (or admin) can view
router.get("/", protect, getAllVideos);

// Admin routes for video management
router.post("/upload", protect, invalidateCacheMiddleware("videos"), uploadVideo);
router.delete("/:id", protect, invalidateCacheMiddleware("videos"), deleteVideo);
router.put("/toggle/:id", protect, invalidateCacheMiddleware("videos"), toggleVideoStatus);

export default router;
