import { z } from "zod";
import { objectIdSchema } from "./common.validation.js";

export const createSubjectSchema = z.object({
  name: z
    .string({ required_error: "Subject name is required" })
    .trim()
    .min(1, "Subject name cannot be empty"),

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

  discountPercent: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : val),
    z.coerce.number().min(0).max(100),
  ),
  classes: objectIdSchema,

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional(),
  ),
});

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name cannot be empty").optional(),

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

  discountPercent: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : val),
    z.coerce.number().min(0).max(100),
  ),

  classes: objectIdSchema.optional(),

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional(),
  ),
});


export const getSubjectsQuerySchema = z.object({
  classes: objectIdSchema.optional(),
});
