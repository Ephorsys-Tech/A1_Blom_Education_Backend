import { z } from "zod";

// Validation schema for Class creation
export const createClassSchema = z.object({
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
      required_error: "Class price is required",
      invalid_type_error: "Class price must be a valid number",
    })
    .min(0, "Price cannot be negative"),

  discountPercent: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : val),
    z.coerce.number().min(0).max(100),
  ),

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional(),
  ),
});

//  Validation schema for Class updates
export const updateClassSchema = z.object({
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
      invalid_type_error: "Class price must be a valid number",
    })
    .min(0, "Price cannot be negative")
    .optional(),

  discountPercent: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : val),
    z.coerce.number().min(0).max(100),
  ),

  sortOrder: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int("Sort order must be an integer").optional(),
  ),

  isActive: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional(),
  ),
});
