import { z } from "zod";
import { objectIdSchema } from "./common.validation.js";

/**
 * Validation schema for Subject creation
 */
export const createSubjectSchema = z.object({
  name: z
    .string({ required_error: "Subject name is required" })
    .trim()
    .min(1, "Subject name cannot be empty"),

  code: z
    .string({ required_error: "Subject code is required" })
    .trim()
    .min(1, "Subject code cannot be empty"),

  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .default(""),

  price: z.coerce
    .number({
      required_error: "Subject price is required",
      invalid_type_error: "Subject price must be a valid number",
    })
    .min(0, "Price cannot be negative"),

  discountPrice: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().min(0, "Discount price cannot be negative").optional()
  ),

  classes: objectIdSchema,

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional()
  ),
});

/**
 * Validation schema for Subject updates
 */
export const updateSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Subject name cannot be empty")
    .optional(),

  code: z
    .string()
    .trim()
    .min(1, "Subject code cannot be empty")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),

  price: z.coerce
    .number({
      invalid_type_error: "Subject price must be a valid number",
    })
    .min(0, "Price cannot be negative")
    .optional(),

  discountPrice: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().min(0, "Discount price cannot be negative").optional()
  ),

  classes: objectIdSchema.optional(),

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
 * Validation schema for Subject query parameters
 */
export const getSubjectsQuerySchema = z.object({
  classes: objectIdSchema.optional(),
});
