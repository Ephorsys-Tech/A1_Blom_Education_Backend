import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
} from "../../controllers/webController/blog.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";

const router = express.Router();

// Public routes
// In the chachedMiddleware the the first params is the name with the based url and the second is the total time in second for expiring the key....
// if the key is the same the it will return the cached data
// if the key is different the it will return the new data
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

// Admin / protected routes
router.post("/", protect, upload.single("image"), createBlog);
router.delete("/:id", protect, deleteBlog);

export default router;
