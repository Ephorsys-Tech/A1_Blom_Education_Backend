import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  getActiveAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
} from "../../controllers/webController/announcement.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { cacheMiddleware, invalidateCacheMiddleware } from "../../utils/redisCache.js";

const router = express.Router();

// Public route to get the active announcement popup
router.get("/active", cacheMiddleware("announcements", 300), getActiveAnnouncement);

// Protected admin routes
router.get("/", protect, getAnnouncements);
router.post("/", protect, invalidateCacheMiddleware("announcements"), upload.single("image"), createAnnouncement);
router.put("/:id/toggle", protect, invalidateCacheMiddleware("announcements"), toggleAnnouncement);
router.delete("/:id", protect, invalidateCacheMiddleware("announcements"), deleteAnnouncement);

export default router;
