import { z } from "zod";

export const studentRegister = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(60, "Name must be less than 60 characters")
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters"),

  email: z.string().trim().email("Enter a valid email").toLowerCase(),

  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits"),

  password: z.string().min(8, "Password should be at least 8 characters"),

  classNumber: z
    .number()
    .int("Class must be an integer")
    .min(6, "Class must be at least 6")
    .max(10, "Class must be at most 10"),

  gender: z.enum(["Male", "Female", "Other"]),

  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept terms and conditions",
  }),
});
