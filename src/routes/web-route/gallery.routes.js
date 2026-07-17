import express from "express";
import {
  uploadImage,
  deleteImage,
  getGallery,
} from "../../controllers/webController/gallery.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";


const router = express.Router();

// Public routes
router.get("/", getGallery);

// Admin / protected routes
router.post("/upload", protect, upload.single("image"), uploadImage);
router.delete("/:id", protect, deleteImage);

export default router;
