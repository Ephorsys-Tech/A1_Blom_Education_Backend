import express from "express";
import {
  uploadReel,
  deleteReel,
  getReels,
  updateReel,
} from "../../controllers/webController/reel.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getReels);

// Admin / protected routes
router.post("/upload", protect, upload.any(), uploadReel);
router.put("/:id", protect, upload.any(), updateReel);
router.delete("/:id", protect, deleteReel);

export default router;
