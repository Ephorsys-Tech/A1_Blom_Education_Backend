import { z } from "zod";
import { objectIdSchema } from "./common.validation.js";

/**
 * Validation schema for Chapter creation
 */
export const createChapterSchema = z.object({
  name: z
    .string({ required_error: "Chapter name is required" })
    .trim()
    .min(1, "Chapter name cannot be empty"),
    
  chapterNumber: z.coerce
    .number({
      required_error: "Chapter number is required",
      invalid_type_error: "Chapter number must be a valid number",
    })
    .int("Chapter number must be an integer")
    .min(1, "Chapter number must be at least 1"),

  description: z
    .string()
    .trim()
    .optional()
    .default(""),

  subject: objectIdSchema,

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional()
  ),
});

/**
 * Validation schema for Chapter updates
 */
export const updateChapterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Chapter name cannot be empty")
    .optional(),

  chapterNumber: z.coerce
    .number({
      invalid_type_error: "Chapter number must be a valid number",
    })
    .int("Chapter number must be an integer")
    .min(1, "Chapter number must be at least 1")
    .optional(),

  description: z
    .string()
    .trim()
    .optional(),

  subject: objectIdSchema.optional(),

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
 * Validation schema for Chapter query parameters
 */
export const getChaptersQuerySchema = z.object({
  subject: objectIdSchema,
});
