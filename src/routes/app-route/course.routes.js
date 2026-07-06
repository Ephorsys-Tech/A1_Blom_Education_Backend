import express from "express";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourses,
  getAdminCourses,
  getCourseById,
} from "../../controllers/appController/course.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createCourseSchema,
  updateCourseSchema,
  getCoursesQuerySchema,
} from "../../validations/course.validation.js";
import { paramIdSchema } from "../../validations/common.validation.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/", validate({ query: getCoursesQuerySchema }), getCourses);
router.get("/:id", validate({ params: paramIdSchema }), getCourseById);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post(
  "/",
  protect,
  authorize("admin", "app-manager"),
  upload.single("thumbnail"),
  validate({ body: createCourseSchema }),
  createCourse
);
router.get(
  "/admin/all",
  protect,
  authorize("admin", "app-manager"),
  validate({ query: getCoursesQuerySchema }),
  getAdminCourses
);
router.put(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  upload.single("thumbnail"),
  validate({ params: paramIdSchema, body: updateCourseSchema }),
  updateCourse
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  validate({ params: paramIdSchema }),
  deleteCourse
);

export default router;

