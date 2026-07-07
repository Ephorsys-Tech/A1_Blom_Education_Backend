import { z } from "zod";

/**
 * Validation schema for Admin Registration
 */
export const registerAdminSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

/**
 * Validation schema for Admin Login (allows email + password, or userId + password)
 */
export const loginAdminSchema = z.union([
  z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .min(1, "Email cannot be empty")
      .email("Enter a valid email address")
      .toLowerCase(),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password cannot be empty"),
  }),
  z.object({
    userId: z
      .string({ required_error: "User ID is required" })
      .trim()
      .min(1, "User ID cannot be empty"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password cannot be empty"),
  }),
]);

/**
 * Validation schema for Admin Refresh Token
 */
export const refreshAdminTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token is required" })
    .trim()
    .min(1, "Refresh token cannot be empty"),
});

/**
 * Validation schema for Forgot Password Request
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),
});

/**
 * Validation schema for Password Reset
 */
export const resetPasswordSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Enter a valid email address")
      .toLowerCase(),

    otp: z
      .string({ required_error: "OTP is required" })
      .trim()
      .regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),

    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),

    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and Confirm Password must match",
    path: ["confirmPassword"],
  });

/**
 * Validation schema for giving access to Managers
 */
export const giveAccessSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),

  role: z.enum(["web-manager", "app-manager"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be 'web-manager' or 'app-manager'",
  }),

  userId: z
    .string({ required_error: "User ID is required" })
    .trim()
    .min(1, "User ID cannot be empty"),
});

/**
 * Validation schema for Verify Admin Email OTP
 */
export const verifyAdminEmailSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),

  otp: z
    .string({ required_error: "OTP is required" })
    .trim()
    .regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),
});

/**
 * Validation schema for Resend Admin OTP
 */
export const resendAdminOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),
});
