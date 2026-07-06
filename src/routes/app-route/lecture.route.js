import express from "express";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  getLectures,
} from "../../controllers/appController/lecture.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import { isAuthenticated } from "../../middleware/isAuthenticated.js";
import upload from "../../middleware/multer.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createLectureSchema,
  updateLectureSchema,
  getLecturesQuerySchema,
} from "../../validations/lecture.validation.js";
import { paramIdSchema } from "../../validations/common.validation.js";

const router = express.Router();

// ==========================================
// STUDENT / VISITOR ROUTES (Protected)
// ==========================================
router.get("/", isAuthenticated, validate({ query: getLecturesQuerySchema }), getLectures);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post(
  "/",
  protect,
  authorize("admin", "app-manager"),
  upload.single("video"),
  validate({ body: createLectureSchema }),
  createLecture
);
router.put(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  upload.single("video"),
  validate({ params: paramIdSchema, body: updateLectureSchema }),
  updateLecture
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  validate({ params: paramIdSchema }),
  deleteLecture
);

export default router;

