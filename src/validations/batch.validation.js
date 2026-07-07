import { z } from "zod";

/**
 * Validation schema for Batch creation
 */
export const createBatchSchema = z.object({
  name: z.enum(["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], {
    required_error: "Batch name is required",
    invalid_type_error: "Batch name must be Class 6, Class 7, Class 8, Class 9, or Class 10",
  }),

  classNumber: z.coerce
    .number({
      required_error: "Class number is required",
      invalid_type_error: "Class number must be a valid number",
    })
    .int("Class number must be an integer")
    .min(6, "Class number must be at least 6")
    .max(10, "Class number must be at most 10"),

  description: z
    .string()
    .trim()
    .max(300, "Description must be less than 300 characters")
    .optional()
    .default(""),

  price: z.coerce
    .number({
      required_error: "Batch price is required",
      invalid_type_error: "Batch price must be a valid number",
    })
    .min(0, "Price cannot be negative"),

  discountPrice: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().min(0, "Discount price cannot be negative").optional()
  ),

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional()
  ),
});

/**
 * Validation schema for Batch updates
 */
export const updateBatchSchema = z.object({
  name: z
    .enum(["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], {
      invalid_type_error: "Batch name must be Class 6, Class 7, Class 8, Class 9, or Class 10",
    })
    .optional(),

  classNumber: z.coerce
    .number({
      invalid_type_error: "Class number must be a valid number",
    })
    .int("Class number must be an integer")
    .min(6, "Class number must be at least 6")
    .max(10, "Class number must be at most 10")
    .optional(),

  description: z
    .string()
    .trim()
    .max(300, "Description must be less than 300 characters")
    .optional(),

  price: z.coerce
    .number({
      invalid_type_error: "Batch price must be a valid number",
    })
    .min(0, "Price cannot be negative")
    .optional(),

  discountPrice: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().min(0, "Discount price cannot be negative").optional()
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
