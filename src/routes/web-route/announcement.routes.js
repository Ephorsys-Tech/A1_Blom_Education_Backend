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

const router = express.Router();

// Public route to get the active announcement popup
router.get("/active", getActiveAnnouncement);

// Protected admin routes
router.get("/", protect, getAnnouncements);
router.post("/", protect, upload.single("image"), createAnnouncement);
router.put("/:id/toggle", protect, toggleAnnouncement);
router.delete("/:id", protect, deleteAnnouncement);

export default router;
