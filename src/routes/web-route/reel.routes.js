import express from "express";
import {
  uploadReel,
  deleteReel,
  getReels,
  updateReel,
} from "../../controllers/webController/reel.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { cacheMiddleware, invalidateCacheMiddleware } from "../../utils/redisCache.js";

const router = express.Router();

// Public routes
router.get("/", cacheMiddleware("reels", 300), getReels);

// Admin / protected routes
router.post("/upload", protect, invalidateCacheMiddleware("reels"), upload.single("thumbnail"), uploadReel);
router.put("/:id", protect, invalidateCacheMiddleware("reels"), upload.single("thumbnail"), updateReel);
router.delete("/:id", protect, invalidateCacheMiddleware("reels"), deleteReel);

export default router;
