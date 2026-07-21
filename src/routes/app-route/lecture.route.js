import express from "express";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  getLectures,
} from "../../controllers/appController/lecture.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import { isAuthenticated } from "../../middleware/isAuthenticated.js";
import { uploadVideoDisk } from "../../middleware/multer.middleware.js";
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

const uploadLectureMedia = uploadVideoDisk.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "thumbnailUrl", maxCount: 1 },
]);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post(
  "/",
  protect,
  authorize("admin", "app-manager"),
  uploadLectureMedia,
  validate({ body: createLectureSchema }),
  createLecture
);
router.put(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  uploadLectureMedia,
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

