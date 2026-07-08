import { z } from "zod";

/**
 * Reusable Express middleware for validating request data using Zod schemas.
 * Supports validating req.body, req.query, and req.params simultaneously or individually.
 *
 * @param {object} schemas - Object containing optional Zod schemas for body, query, and/or params
 * @returns {Function} Express middleware function
 */
export const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      // Validate request body if schema is provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters if schema is provided
      if (schemas.query) {
        Object.defineProperty(req, 'query', {
          value: await schemas.query.parseAsync(req.query),
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }

      // Validate route parameters if schema is provided
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Return 400 Bad Request with nicely formatted validation errors
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.format(),
        });
      }
      next(error);
    }
  };
};
