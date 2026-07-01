import express from "express";
import {
  uploadReel,
  deleteReel,
  getReels,
  updateReel,
} from "../controllers/reel.controller.js";
import protect from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getReels);

// Admin / protected routes
router.post("/upload", protect, upload.single("thumbnail"), uploadReel);
router.put("/:id", protect, upload.single("thumbnail"), updateReel);
router.delete("/:id", protect, deleteReel);

export default router;
