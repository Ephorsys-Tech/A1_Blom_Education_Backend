import Student from "../model/appModel/student.model.js";
import Batch from "../model/appModel/batch.model.js";
import Course from "../model/appModel/course.model.js";
import { generateAccessToken } from "../utils/generateAccessToken.js";
import { generateOTP } from "../utils/generateOTP.js";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";
import { sendOTP } from "../utils/sendOTP.js";
import { verifyOTP } from "../utils/verifyOTP.js";
import { sendEmailOTP } from "../utils/sendEmailOTP.js";
import { sendCongratulationMail } from "../utils/sendCongratulationMail.js";
import jwt from "jsonwebtoken";

// ==========================================
// Register Student Service
// ==========================================
  export const registerStudentService = async (data) => {
    const { fullName, email, mobile, password, classNumber, gender, acceptedTerms } = data;

    const mobileExists = await Student.findOne({ mobile });
    if (mobileExists) {
      throw new Error("Mobile number already registered.");
    }

    const emailExists = await Student.findOne({ email });
    if (emailExists) {
      throw new Error("Email address already registered.");
    }

    const emailOTP = generateOTP();
    const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const student = await Student.create({
      fullName,
      email,
      mobile,
      password,
      classNumber,
      gender,
      acceptedTerms,
      acceptedTermsAt: new Date(),
      emailVerificationOTP: emailOTP,
      emailVerificationOTPExpires: emailOTPExpires,
    });

    // Send mobile and email OTPs
    await sendOTP(student.mobile);
    await sendEmailOTP(student.email, emailOTP);

    // Send Congratulation/Welcome email
    try {
      await sendCongratulationMail(student.email, student.fullName, { mobile, classNumber });
    } catch (err) {
      console.error("Failed to send congratulation email:", err);
    }

    return {
      id: student._id,
      fullName: student.fullName,
      mobile: student.mobile,
      email: student.email,
      isMobileVerified: student.isMobileVerified,
      isEmailVerified: student.isEmailVerified,
    };
  };

// ==========================================
// Verify Mobile OTP Service
// ==========================================

export const verifyMobileOTPService = async (data) => {
  const { mobile, otp } = data;

  if (!mobile || !otp) {
    const error = new Error("Mobile and OTP are required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ mobile });

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  // Verify OTP using Twilio
  const verification = await verifyOTP(mobile, otp);

  if (verification.status !== "approved") {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  student.isMobileVerified = true;

  await student.save();

  return {
    id: student._id,
    fullName: student.fullName,
    mobile: student.mobile,
    isMobileVerified: student.isMobileVerified,
  };
};

// ==========================================
// Resend Mobile OTP Service
// ==========================================

export const resendMobileOTPService = async (data) => {
  const { mobile } = data;

  if (!mobile) {
    const error = new Error("Mobile number is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ mobile });

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  if (student.isMobileVerified) {
    const error = new Error("Mobile already verified.");
    error.statusCode = 400;
    throw error;
  }

  // Send OTP using Twilio
  await sendOTP(student.mobile);

  return true;
};

// ==========================================
// Verify Email OTP Service
// ==========================================

export const verifyEmailOTPService = async (data) => {
  const { email, otp } = data;

  if (!email || !otp) {
    const error = new Error("Email and OTP are required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ email });

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  if (student.isEmailVerified) {
    const error = new Error("Email already verified.");
    error.statusCode = 400;
    throw error;
  }

  if (!student.emailVerificationOTP || student.emailVerificationOTP !== otp) {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > student.emailVerificationOTPExpires) {
    const error = new Error("OTP has expired.");
    error.statusCode = 400;
    throw error;
  }

  student.isEmailVerified = true;
  student.emailVerificationOTP = undefined;
  student.emailVerificationOTPExpires = undefined;

  await student.save();

  return {
    id: student._id,
    fullName: student.fullName,
    email: student.email,
    isEmailVerified: student.isEmailVerified,
  };
};

// ==========================================
// Resend Email OTP Service
// ==========================================

export const resendEmailOTPService = async (data) => {
  const { email } = data;

  if (!email) {
    const error = new Error("Email is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ email });

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  if (student.isEmailVerified) {
    const error = new Error("Email already verified.");
    error.statusCode = 400;
    throw error;
  }

  const emailOTP = generateOTP();
  const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  student.emailVerificationOTP = emailOTP;
  student.emailVerificationOTPExpires = emailOTPExpires;

  await student.save();

  await sendEmailOTP(student.email, emailOTP);

  return true;
};

// ==========================================
// LOGIN Student Service
// ==========================================

export const loginStudentService = async (data) => {
  const { mobile, password } = data;

  // ==========================================
  // Validation
  // ==========================================

  if (!mobile || !password) {
    const error = new Error("Mobile and Password are required.");
    error.statusCode = 400;
    throw error;
  }

  // ==========================================
  // Find Student
  // ==========================================

  const student = await Student.findOne({ mobile }).select(
    "+password +refreshToken",
  );

  if (!student) {
    const error = new Error("Invalid Mobile Number.");
    error.statusCode = 404;
    throw error;
  }

  // ==========================================
  // Mobile Verification
  // ==========================================

  if (!student.isMobileVerified) {
    const error = new Error("Please verify your mobile number first.");
    error.statusCode = 403;
    throw error;
  }

  // ==========================================
  // Email Verification
  // ==========================================

  if (!student.isEmailVerified) {
    const error = new Error("Please verify your email address first.");
    error.statusCode = 403;
    throw error;
  }

  // ==========================================
  // Account Status
  // ==========================================

  if (!student.isActive) {
    const error = new Error("Your account is inactive.");
    error.statusCode = 403;
    throw error;
  }

  if (student.isBlocked) {
    const error = new Error("Your account has been blocked.");
    error.statusCode = 403;
    throw error;
  }

  // ==========================================
  // Compare Password
  // ==========================================

  const isPasswordMatched = await student.comparePassword(password);

  if (!isPasswordMatched) {
    const error = new Error("Invalid Password.");
    error.statusCode = 401;
    throw error;
  }

  // ==========================================
  // Generate Tokens
  // ==========================================

  const accessToken = generateAccessToken(student);
  const refreshToken = generateRefreshToken(student._id);

  // ==========================================
  // Save Refresh Token
  // ==========================================

  student.refreshToken = refreshToken;
  student.lastLogin = new Date();
  student.loginCount += 1;

  await student.save();

  // ==========================================
  // Return Response
  // ==========================================

  return {
    accessToken,
    refreshToken,
    student: {
      id: student._id,
      fullName: student.fullName,
      mobile: student.mobile,
      selectedBatch: student.selectedBatch,
      role: student.role,
    },
  };
};
// ==========================================
// GET MY PROFILE SERVICE
// ==========================================

export const getMyProfileService = async (studentId) => {
  if (!studentId) {
    const error = new Error("Student ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId)
    .populate("selectedBatch")
    .populate("enrolledCourses.course")
    .populate("enrolledBatches.batch")

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  return student;
};

// ==========================================
// UPDATE PROFILE SERVICE
// ==========================================

export const updateProfileService = async (studentId, data) => {
  if (!studentId) {
    const error = new Error("Student ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId);

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  const { fullName, gender, selectedBatch, deviceToken, deviceType } = data;

  if (fullName) student.fullName = fullName;
  if (gender) student.gender = gender;

  if (
    selectedBatch &&
    selectedBatch.toString() !== student.selectedBatch.toString()
  ) {
    const newBatch = await Batch.findById(selectedBatch);
    if (!newBatch) {
      const error = new Error("New selected batch does not exist.");
      error.statusCode = 404;
      throw error;
    }

    // Decrement count from old batch
    if (student.selectedBatch) {
      await Batch.findByIdAndUpdate(student.selectedBatch, {
        $inc: { totalStudents: -1 },
      });
    }

    // Increment count in new batch
    newBatch.totalStudents = (newBatch.totalStudents || 0) + 1;
    await newBatch.save();

    student.selectedBatch = selectedBatch;
  }

  if (deviceToken) student.deviceToken = deviceToken;
  if (deviceType) student.deviceType = deviceType;

  await student.save();

  return Student.findById(studentId)
    .populate("selectedBatch")
    .populate("enrolledCourses.course")
    .populate("enrolledBatches.batch");
};

// ==========================================
// LOGOUT SERVICE
// ==========================================

export const logoutStudentService = async (studentId) => {
  if (!studentId) {
    const error = new Error("Student ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId);

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  // Clear Refresh Token
  student.refreshToken = "";

  // Invalidate any outstanding Access Tokens immediately
  student.tokenVersion = (student.tokenVersion || 0) + 1;

  // Optional: Clear Device Token
  // student.deviceToken = "";

  await student.save();

  return true;
};

// ==========================================
// STEP 1: REQUEST DELETE OTP SERVICE
// ==========================================

export const requestDeleteAccountOTPService = async (studentId) => {
  if (!studentId) {
    const error = new Error("Student ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId);

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  // Send OTP to registered mobile number
  await sendOTP(student.mobile);

  return true;
};

// ==========================================
// STEP 2: VERIFY OTP & DELETE ACCOUNT SERVICE
// ==========================================

export const confirmDeleteAccountService = async (studentId, otp) => {
  if (!studentId) {
    const error = new Error("Student ID is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!otp) {
    const error = new Error("OTP is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId);

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  // Verify OTP
  const verification = await verifyOTP(student.mobile, otp);

  if (verification.status !== "approved") {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  // Decrement totalStudents count in their selected batch
  if (student.selectedBatch) {
    await Batch.findByIdAndUpdate(student.selectedBatch, {
      $inc: { totalStudents: -1 },
    });
  }

  // Decrement totalStudents count in all enrolled batches
  if (student.enrolledBatches && student.enrolledBatches.length > 0) {
    const batchIds = student.enrolledBatches.map((b) => b.batch);
    await Batch.updateMany(
      { _id: { $in: batchIds } },
      { $inc: { totalStudents: -1 } },
    );
  }

  // Hard Delete Account
  await Student.findByIdAndDelete(studentId);

  return true;
};

// ==========================================
// ENROLL STUDENT SERVICE
// ==========================================

export const enrollStudentService = async (studentId, data) => {
  const { type, id, paymentId, amountPaid } = data;

  if (!type || !id) {
    const error = new Error(
      "Enrollment type ('course' or 'batch') and target ID are required.",
    );
    error.statusCode = 400;
    throw error;
  }

  // Payment check
  if (!paymentId || amountPaid === undefined || Number(amountPaid) < 0) {
    const error = new Error(
      "Valid payment details (paymentId, amountPaid) are required for enrollment.",
    );
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(studentId);
  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  if (type === "course") {
    const course = await Course.findById(id);
    if (!course || !course.isActive) {
      const error = new Error("Course not found or inactive.");
      error.statusCode = 404;
      throw error;
    }

    // Check if student is already enrolled in the course
    const isEnrolled = student.enrolledCourses.some(
      (item) => item.course.toString() === course._id.toString(),
    );

    if (isEnrolled) {
      const error = new Error("Already enrolled in this course.");
      error.statusCode = 400;
      throw error;
    }

    student.enrolledCourses.push({
      course: course._id,
      enrolledAt: new Date(),
      paymentId,
      amountPaid,
      paymentStatus: "Completed",
    });
  } else if (type === "batch") {
    const batch = await Batch.findById(id);
    if (!batch || !batch.isActive) {
      const error = new Error("Batch not found or inactive.");
      error.statusCode = 404;
      throw error;
    }

    // Check if student is already enrolled in the batch
    const isEnrolledInBatch = student.enrolledBatches.some(
      (item) => item.batch.toString() === batch._id.toString(),
    );

    if (isEnrolledInBatch) {
      const error = new Error("Already enrolled in this batch.");
      error.statusCode = 400;
      throw error;
    }

    student.enrolledBatches.push({
      batch: batch._id,
      enrolledAt: new Date(),
      paymentId,
      amountPaid,
      paymentStatus: "Completed",
    });

    // Find all active courses of this batch
    const courses = await Course.find({ batch: batch._id, isActive: true });

    // Add each course to enrolledCourses if not already present
    for (const course of courses) {
      const isAlreadyEnrolled = student.enrolledCourses.some(
        (item) => item.course.toString() === course._id.toString(),
      );

      if (!isAlreadyEnrolled) {
        student.enrolledCourses.push({
          course: course._id,
          enrolledAt: new Date(),
          paymentId,
          amountPaid: 0, // Individual course paid via batch enrollment
          paymentStatus: "Completed",
        });
      }
    }

    // Increment totalStudents count for the enrolled batch
    batch.totalStudents = (batch.totalStudents || 0) + 1;
    await batch.save();
  } else {
    const error = new Error(
      "Invalid enrollment type. Must be 'course' or 'batch'.",
    );
    error.statusCode = 400;
    throw error;
  }

  await student.save();

  return Student.findById(studentId)
    .populate("selectedBatch")
    .populate("enrolledCourses.course")
    .populate("enrolledBatches.batch");
};

// ==========================================
// REFRESH ACCESS TOKEN SERVICE
// ==========================================

export const refreshAccessTokenService = async (incomingRefreshToken) => {
  // If no refresh token found then login again
  if (!incomingRefreshToken) {
    const error = new Error("Refresh token is missing. Please login again.");
    error.statusCode = 401;
    error.code = "SESSION_EXPIRED";
    throw error;
  }

  // ------------------------------------------
  // Verify Refresh Token Signature & Expiry
  // This is the check that decides everything:
  // - expired REFRESH_TOKEN_EXPIRE (30d) → throws here
  // - tampered/invalid signature       → throws here
  // ------------------------------------------

  let decoded;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch (err) {
    const error = new Error("Session expired. Please login again.");
    error.statusCode = 401;
    error.code = "SESSION_EXPIRED";
    throw error;
  }

  // ------------------------------------------
  // Find Student
  // (refreshToken field has select:false, so pull it explicitly)
  // ------------------------------------------

  const student = await Student.findById(decoded.id).select("+refreshToken");
  if (!student) {
    const error = new Error("Student not found. Please login again.");
    error.statusCode = 401;
    error.code = "SESSION_EXPIRED";
    throw error;
  }

  if (student.isBlocked || !student.isActive) {
    const error = new Error("Account is blocked or inactive.");
    error.statusCode = 403;
    error.code = "ACCOUNT_BLOCKED";
    throw error;
  }

  // ------------------------------------------
  // Confirm this refresh token is the one we
  // actually issued (e.g. student logged out on
  // this device already → refreshToken was cleared)
  // ------------------------------------------
  if (!student.refreshToken || student.refreshToken !== incomingRefreshToken) {
    const error = new Error("Session expired. Please login again.");
    error.statusCode = 401;
    error.code = "SESSION_EXPIRED";
    throw error;
  }

  // ------------------------------------------
  // Everything checks out → issue a fresh
  // Access Token only. Refresh Token is left
  // untouched so it keeps counting down its
  // own 30d lifespan.
  // ------------------------------------------
  const newAccessToken = generateAccessToken(student);

  return { accessToken: newAccessToken };
};
