import express from "express";
import {
  createChapter,
  updateChapter,
  deleteChapter,
  getChapters,
  getAdminChapters,
  getChapterById,
} from "../../controllers/appController/chapter.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createChapterSchema,
  updateChapterSchema,
  getChaptersQuerySchema,
} from "../../validations/chapter.validation.js";
import { paramIdSchema } from "../../validations/common.validation.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/", validate({ query: getChaptersQuerySchema }), getChapters);
router.get("/:id", validate({ params: paramIdSchema }), getChapterById);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post(
  "/",
  protect,
  authorize("admin", "app-manager"),
  upload.none(),
  validate({ body: createChapterSchema }),
  createChapter
);
router.get(
  "/admin/all",
  protect,
  authorize("admin", "app-manager"),
  validate({ query: getChaptersQuerySchema }),
  getAdminChapters
);
router.put(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  upload.none(),
  validate({ params: paramIdSchema, body: updateChapterSchema }),
  updateChapter
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  validate({ params: paramIdSchema }),
  deleteChapter
);

export default router;

