import express from "express";
import {
  uploadReel,
  deleteReel,
  getReels,
} from "../controllers/reel.controller.js";
import protect from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getReels);

// Admin / protected routes
router.post("/upload", protect, upload.single("video"), uploadReel);
router.delete("/:id", protect, deleteReel);

export default router;
