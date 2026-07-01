import Student from "../model/StudentModel/student.model.js";
import { generateAccessToken } from "../utils/generateAccessToken.js";
import { generateOTP } from "../utils/generateOTP.js";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";
import { sendOTP } from "../utils/sendOTP.js";
import { verifyOTP } from "../utils/verifyOTP.js";

// ==========================================
// Register Student Service
// ==========================================
export const registerStudentService = async (data) => {
  const { fullName, mobile, password, gender, selectedBatch, acceptedTerms } =
    data;

  if (!fullName || !mobile || !password || !gender || !selectedBatch) {
    throw new Error("All fields are required.");
  }

  if (!acceptedTerms) {
    throw new Error("Please accept Terms & Conditions.");
  }

  const mobileExists = await Student.findOne({ mobile });

  if (mobileExists) {
    throw new Error("Mobile number already registered.");
  }

  const student = await Student.create({
    fullName,
    mobile,
    password,
    gender,
    selectedBatch,
    acceptedTerms,
    acceptedTermsAt: new Date(),
  });

  await sendOTP(student.mobile);

  return {
    id: student._id,
    fullName: student.fullName,
    mobile: student.mobile,
    selectedBatch: student.selectedBatch,
    isMobileVerified: student.isMobileVerified,
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

  const accessToken = generateAccessToken(student._id);
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

  const student = await Student.findById(studentId);

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
  if (selectedBatch) student.selectedBatch = selectedBatch;
  if (deviceToken) student.deviceToken = deviceToken;
  if (deviceType) student.deviceType = deviceType;

  await student.save();

  return student;
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

  // Hard Delete Account
  await Student.findByIdAndDelete(studentId);

  return true;
};
