import express from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getClasses,
  getClassById,
} from "../../controllers/appController/classes.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createClassSchema, updateClassSchema } from "../../validations/classes.validation.js";
import { paramIdSchema } from "../../validations/common.validation.js";

const router = express.Router();

// PUBLIC ROUTES For student and admin also
// get classes
// get -> api/v1/classes
router.get("/", getClasses);


// get class By Id
// get class -> api/v1/class/:id
router.get(
  "/:id",
  getClassById
);

// ---------------------------------------------------------------------//
// ADMIN ROUTES (Protected)

// Create Classes
// POST -> api/v1/classes   
router.post(
  "/",
  protect,
  authorize("admin", "app-manager"),
  upload.single("thumbnail"),
  validate({ body: createClassSchema }),
  createClass
);

// update class
// put -> api/v1/classes/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  upload.single("thumbnail"),
  validate({ params: paramIdSchema, body: updateClassSchema }),
  updateClass
);

// delete class
// delete -> api/v1/classes/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  validate({ params: paramIdSchema }),
  deleteClass
);




export default router;
