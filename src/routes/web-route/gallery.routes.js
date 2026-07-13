import express from "express";
import {
  uploadImage,
  deleteImage,
  getGallery,
} from "../../controllers/webController/gallery.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { cacheMiddleware, invalidateCacheMiddleware } from "../../utils/redisCache.js";

const router = express.Router();

// Public routes
router.get("/", cacheMiddleware("gallery", 300), getGallery);

// Admin / protected routes
router.post("/upload", protect, invalidateCacheMiddleware("gallery"), upload.single("image"), uploadImage);
router.delete("/:id", protect, invalidateCacheMiddleware("gallery"), deleteImage);

export default router;
