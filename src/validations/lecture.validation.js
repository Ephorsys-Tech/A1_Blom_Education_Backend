import { z } from "zod";
import { objectIdSchema } from "./common.validation.js";

/**
 * Validation schema for Lecture creation
 */
export const createLectureSchema = z.object({
  title: z
    .string({ required_error: "Lecture title is required" })
    .trim()
    .min(1, "Lecture title cannot be empty"),

  description: z
    .string()
    .trim()
    .optional()
    .default(""),

  thumbnailUrl: z
    .string()
    .trim()
    .optional(),

  videoUrl: z
    .string()
    .trim()
    .url("Invalid video URL format")
    .optional(),

  chapter: objectIdSchema,

  classes: objectIdSchema.optional(),

  isPreview: z.preprocess(
    (val) => (val === "true" || val === true ? true : false),
    z.boolean().optional().default(false)
  ),

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional()
  ),
});

/**
 * Validation schema for Lecture updates
 */
export const updateLectureSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Lecture title cannot be empty")
    .optional(),

  description: z
    .string()
    .trim()
    .optional(),

  thumbnailUrl: z
    .string()
    .trim()
    .optional(),

  videoUrl: z
    .string()
    .trim()
    .url("Invalid video URL format")
    .optional(),

  chapter: objectIdSchema.optional(),

  classes: objectIdSchema.optional(),

  isPreview: z.preprocess(
    (val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : val),
    z.boolean().optional()
  ),

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional()
  ),

  isActive: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional()
  ),
});

/**
 * Validation schema for Lecture querying
 */
export const getLecturesQuerySchema = z.object({
  chapter: objectIdSchema,
});
