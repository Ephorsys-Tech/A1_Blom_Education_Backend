import { z } from "zod";
import mongoose from "mongoose";

// ==========================================
// COMMON VALIDATORS
// ==========================================

const objectIdSchema = z.string().refine(
  (id) => mongoose.Types.ObjectId.isValid(id),
  {
    message: "Invalid ObjectId",
  }
);

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Mobile number must be a valid 10-digit Indian number");

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email")
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long");

const genderSchema = z.enum(["Male", "Female", "Other"]);

const dobSchema = z.coerce.date().refine((date) => {
  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();

  const monthDiff = today.getMonth() - date.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    age--;
  }

  return age >= 8 && age <= 20;
}, {
  message: "Student age must be between 8 and 20 years.",
});

// ==========================================
// STUDENT REGISTER
// ==========================================

export const studentRegister = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(60, "Name must be less than 60 characters")
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters"),

  email: emailSchema,

  mobile: mobileSchema,

  parentsMobile: mobileSchema.optional(),

  address: z
    .string()
    .trim()
    .min(3, "Address is required")
    .max(200, "Address is too long"),

  pinCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "PIN code must be exactly 6 digits"),

  dob: dobSchema,

  schoolName: z
    .string()
    .trim()
    .min(2, "School name must be at least 2 characters")
    .max(100, "School name is too long"),

  selectedClass: objectIdSchema,

  gender: genderSchema,

  acceptedTerms: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the Terms & Conditions",
    }),
  }),
});

// ==========================================
// UPDATE PROFILE
// ==========================================

export const studentUpdateProfile = z.object({
  fullName: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters")
    .optional(),

  parentsMobile: mobileSchema.optional(),

  email: emailSchema.optional(),

  address: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .optional(),

  pinCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "PIN code must be exactly 6 digits")
    .optional(),

  dob: dobSchema.optional(),

  gender: genderSchema.optional(),

  schoolName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  selectedClass: objectIdSchema.optional(),

  notificationEnabled: z.boolean().optional(),

  deviceToken: z.string().trim().optional(),

  deviceType: z.enum(["android", "ios", "web"]).optional(),
});

// ==========================================
// LOGIN
// ==========================================

export const studentLogin = z.object({
  mobile: mobileSchema,

  otp: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers")
    .optional(),
});

// ==========================================
// VERIFY EMAIL OTP
// ==========================================

export const verifyEmailOTP = z.object({
  email: emailSchema,

  otp: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

// ==========================================
// VERIFY MOBILE OTP
// ==========================================

export const verifyMobileOTP = z.object({
  mobile: mobileSchema,

  otp: z
    .string()
    .trim()
    .length(6)
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword = z.object({
  email: emailSchema,
});

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword = z.object({
  token: z.string().trim(),

  password: passwordSchema,

  confirmPassword: passwordSchema,
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  }
);

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changePassword = z.object({
  currentPassword: passwordSchema,

  newPassword: passwordSchema,

  confirmPassword: passwordSchema,
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  }
);