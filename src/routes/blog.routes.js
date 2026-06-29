import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
} from "../controllers/blog.controller.js";
import protect from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

// Admin / protected routes
router.post("/", protect, upload.single("image"), createBlog);
router.delete("/:id", protect, deleteBlog);

export default router;
