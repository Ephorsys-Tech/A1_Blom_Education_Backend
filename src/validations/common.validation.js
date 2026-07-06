import { z } from "zod";

/**
 * Common schema for MongoDB ObjectId validation
 */
export const objectIdSchema = z
  .string({ required_error: "ID is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

/**
 * Common request parameter schema that validates standard route parameter :id
 */
export const paramIdSchema = z.object({
  id: objectIdSchema,
});
