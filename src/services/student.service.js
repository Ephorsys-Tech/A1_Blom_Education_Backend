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

  // Validation
  if (!fullName || !mobile || !password || !gender || !selectedBatch) {
    throw new Error("All fields are required.");
  }

  if (!acceptedTerms) {
    throw new Error("Please accept Terms & Conditions.");
  }

  // Check Mobile
  const mobileExists = await Student.findOne({ mobile });

  if (mobileExists) {
    throw new Error("Mobile number already registered.");
  }

  // Create Student
  const student = await Student.create({
    fullName,
    mobile,
    password,
    gender,
    selectedBatch,
    acceptedTerms,
    acceptedTermsAt: new Date(),
  });

  // Send OTP using Twilio Verify
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
// Verify Mobile OTP
// ==========================================

export const verifyMobileOTPService = async (data) => {
  const { mobile, otp } = data;

  if (!mobile || !otp) {
    throw new Error("Mobile and OTP are required.");
  }

  const student = await Student.findOne({ mobile });

  if (!student) {
    throw new Error("Student not found.");
  }

  // Verify OTP using Twilio
  const verification = await verifyOTP(mobile, otp);

  if (verification.status !== "approved") {
    throw new Error("Invalid OTP.");
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
// Resend OTP
// ==========================================

export const resendMobileOTPService = async (data) => {
  const { mobile } = data;

  if (!mobile) {
    throw new Error("Mobile number is required.");
  }

  const student = await Student.findOne({ mobile });

  if (!student) {
    throw new Error("Student not found.");
  }

  if (student.isMobileVerified) {
    throw new Error("Mobile already verified.");
  }

  // Twilio will send a new OTP
  await sendOTP(student.mobile);

  return true;
};

// ==========================================
// LOGIN Student
// ==========================================
export const loginStudentService = async (data) => {
  const { mobile, password } = data;

  // ==========================================
  // Validation
  // ==========================================

  if (!mobile || !password) {
    throw new Error("Mobile and Password are required.");
  }

  // ==========================================
  // Find Student
  // ==========================================

  const student = await Student.findOne({ mobile }).select(
    "+password +refreshToken",
  );

  if (!student) {
    throw new Error("Invalid Mobile Number.");
  }

  // ==========================================
  // Mobile Verification
  // ==========================================

  if (!student.isMobileVerified) {
    throw new Error("Please verify your mobile number first.");
  }

  // ==========================================
  // Account Status
  // ==========================================

  if (!student.isActive) {
    throw new Error("Your account is inactive.");
  }

  if (student.isBlocked) {
    throw new Error("Your account has been blocked.");
  }

  // ==========================================
  // Compare Password
  // ==========================================

  const isPasswordMatched = await student.comparePassword(password);

  if (!isPasswordMatched) {
    throw new Error("Invalid Password.");
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

  // Front-end can store the Token in  Secure Storag

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
    throw new Error("Student ID is required.");
  }

  const student = await Student.findById(studentId);

  if (!student) {
    throw new Error("Student not found.");
  }

  return student;
};

// ==========================================
// UPDATE PROFILE SERVICE
// ==========================================

export const updateProfileService = async (studentId, data) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new Error("Student not found.");
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
  const student = await Student.findById(studentId);

  if (!student) {
    throw new Error("Student not found.");
  }

  student.refreshToken = "";
  await student.save();

  return true;
};

// ==========================================
// STEP 1: REQUEST DELETE OTP
// ==========================================

export const requestDeleteAccountOTPService = async (studentId) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new Error("Student not found.");
  }

  // Send OTP to mobile
  await sendOTP(student.mobile);

  return true;
};

// ==========================================
// STEP 2: VERIFY OTP & DELETE ACCOUNT
// ==========================================

export const confirmDeleteAccountService = async (studentId, otp) => {
  if (!otp) {
    throw new Error("OTP is required.");
  }

  const student = await Student.findById(studentId);

  if (!student) {
    throw new Error("Student not found.");
  }

  // Verify OTP
  const verification = await verifyOTP(student.mobile, otp);

  if (verification.status !== "approved") {
    throw new Error("Invalid OTP.");
  }

  // HARD DELETE
  await Student.findByIdAndDelete(studentId);

  return true;
};
