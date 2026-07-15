import Student from "../model/appModel/student.model.js";
import Classes from "../model/appModel/classes.model.js";
// import Subject from "../model/appModel/subjects.model.js";
import PendingStudent from "../model/appModel/pendingStudent.model.js";
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
  const {
    fullName,
    email,
    password,
    mobile,
    parentsMobile,
    address,
    pinCode,
    dob,
    gender,
    schoolName,
    selectedClass,
    acceptedTerms,
  } = data;

  // ==========================================
  // CHECK MOBILE
  // ==========================================

  const mobileExists = await Student.findOne({ mobile });
  if (mobileExists) {
    throw new Error("Mobile number already registered.");
  }

  // ==========================================
  // CHECK EMAIL
  // ==========================================

  const emailExists = await Student.findOne({ email });
  if (emailExists) {
    throw new Error("Email address already registered.");
  }

  // ==========================================
  // VERIFY CLASS EXISTS
  // ==========================================

  const classData = await Classes.findById(selectedClass);
  if (!classData) {
    throw new Error("Selected class does not exist.");
  }

  // ==========================================
  // CLEAR EXISTING PENDING REGISTRATIONS
  // ==========================================

  await PendingStudent.deleteMany({ $or: [{ email }, { mobile }] });

  // ==========================================
  // GENERATE OTPs
  // ==========================================

  const emailOTP = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // ==========================================
  // CREATE PENDING STUDENT
  // ==========================================

  const pendingStudent = await PendingStudent.create({
    fullName,
    email,
    password,
    mobile,
    parentsMobile,
    address,
    pinCode,
    dob,
    gender,
    schoolName,
    selectedClass,
    acceptedTerms,
    acceptedTermsAt: new Date(),
    
    emailVerificationOTP: emailOTP,
    emailVerificationOTPExpires: otpExpiry,
  });

  // ==========================================
  // SEND OTPs
  // ==========================================

  try {
    // Calling sendOTP without a second argument triggers Twilio Verify to send a real SMS OTP
    await sendOTP(pendingStudent.mobile);
  } catch (err) {
    console.error("Warning: SMS OTP failed to send. Proceeding anyway. Error:", err.message);
  }

  try {
    await sendEmailOTP(pendingStudent.email, emailOTP);
  } catch (err) {
    console.error("Warning: Email OTP failed to send. Proceeding anyway. Error:", err.message);
  }

  // ==========================================
  // RETURN RESPONSE
  // ==========================================

  return {
    email: pendingStudent.email,
    mobile: pendingStudent.mobile,
    isEmailVerified: false,
    isMobileVerified: false,
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

  // 1. Check if there is a pending registration
  const pendingStudent = await PendingStudent.findOne({ mobile });

  if (pendingStudent) {
    // Enforce email verification first
    if (!pendingStudent.isEmailVerified) {
      const error = new Error("Please verify your email address first.");
      error.statusCode = 400;
      throw error;
    }

    // Verify Mobile OTP via Twilio Verify Service
    const verification = await verifyOTP(mobile, otp);

    if (verification.status !== "approved") {
      const error = new Error("Invalid OTP.");
      error.statusCode = 400;
      throw error;
    }

    // Class validation
    const classData = await Classes.findById(pendingStudent.selectedClass);
    if (!classData) {
      const error = new Error("Selected class does not exist.");
      error.statusCode = 404;
      throw error;
    }

    // Create Student in main collection
    const student = await Student.create({
      fullName: pendingStudent.fullName,
      email: pendingStudent.email,
      password: pendingStudent.password,
      mobile: pendingStudent.mobile,
      parentsMobile: pendingStudent.parentsMobile,
      address: pendingStudent.address,
      pinCode: pendingStudent.pinCode,
      dob: pendingStudent.dob,
      gender: pendingStudent.gender,
      schoolName: pendingStudent.schoolName,
      selectedClass: pendingStudent.selectedClass,
      acceptedTerms: pendingStudent.acceptedTerms,
      acceptedTermsAt: pendingStudent.acceptedTermsAt,
      isMobileVerified: true,
      isEmailVerified: true,
    });

    // Increment Class student count
    await Classes.findByIdAndUpdate(pendingStudent.selectedClass, {
      $inc: { totalStudents: 1 },
    });

    // Generate tokens for auto login
    const accessToken = generateAccessToken(student);
    const refreshToken = generateRefreshToken(student._id);

    student.refreshToken = refreshToken;
    student.lastLogin = new Date();
    student.loginCount = 1;
    await student.save();

    // Delete pending record
    await PendingStudent.deleteOne({ _id: pendingStudent._id });

    // Send Welcome mail
    try {
      await sendCongratulationMail(student.email, student.fullName, {
        mobile: student.mobile,
        classNumber: classData.classNumber,
      });
    } catch (err) {
      console.error("Welcome email failed:", err.message);
    }

    return {
      accessToken,
      refreshToken,
      student: {
        id: student._id,
        fullName: student.fullName,
        mobile: student.mobile,
        selectedClass: student.selectedClass,
        role: student.role,
      },
    };
  }

  // 2. Fallback to login flow if no pending registration
  const student = await Student.findOne({ mobile });

  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  // Verify OTP using Twilio (for login)
  const verification = await verifyOTP(mobile, otp);

  if (verification.status !== "approved") {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  student.isMobileVerified = true;
  student.isEmailVerified = true; // Auto-verify email as well to prevent blocking access

  // Invalidate any other active sessions/devices for single-device login
  student.tokenVersion = (student.tokenVersion || 0) + 1;

  const accessToken = generateAccessToken(student);
  const refreshToken = generateRefreshToken(student._id);

  student.refreshToken = refreshToken;
  student.lastLogin = new Date();
  student.loginCount += 1;

  await student.save();

  return {
    accessToken,
    refreshToken,
    student: {
      id: student._id,
      fullName: student.fullName,
      mobile: student.mobile,
      selectedClass: student.selectedClass,
      role: student.role,
    },
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

  // 1. Check if there is a pending registration
  const pendingStudent = await PendingStudent.findOne({ mobile });

  if (pendingStudent) {
    if (pendingStudent.isMobileVerified) {
      const error = new Error("Mobile already verified.");
      error.statusCode = 400;
      throw error;
    }

    // Resend real OTP via Twilio Verify Service
    await sendOTP(pendingStudent.mobile);
    return true;
  }

  // 2. Fallback to existing student (for login flow, etc.)
  const student = await Student.findOne({ mobile });

  if (!student) {
    const error = new Error("Registration session expired or student not found.");
    error.statusCode = 404;
    throw error;
  }

  if (student.isMobileVerified) {
    const error = new Error("Mobile already verified.");
    error.statusCode = 400;
    throw error;
  }

  // Send OTP using Twilio Verify (login flow)
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

  const pendingStudent = await PendingStudent.findOne({ email });

  if (!pendingStudent) {
    const studentExists = await Student.findOne({ email });
    if (studentExists) {
      const error = new Error("Email already registered and verified.");
      error.statusCode = 400;
      throw error;
    }
    const error = new Error("Registration session expired or not found. Please register again.");
    error.statusCode = 404;
    throw error;
  }

  if (pendingStudent.isEmailVerified) {
    const error = new Error("Email already verified.");
    error.statusCode = 400;
    throw error;
  }

  if (pendingStudent.emailVerificationOTP !== otp) {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > pendingStudent.emailVerificationOTPExpires) {
    const error = new Error("OTP has expired.");
    error.statusCode = 400;
    throw error;
  }

  pendingStudent.isEmailVerified = true;
  await pendingStudent.save();

  return {
    email: pendingStudent.email,
    isEmailVerified: true,
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

  // 1. Check if there is a pending registration
  const pendingStudent = await PendingStudent.findOne({ email });

  if (pendingStudent) {
    if (pendingStudent.isEmailVerified) {
      const error = new Error("Email already verified.");
      error.statusCode = 400;
      throw error;
    }

    const emailOTP = generateOTP();
    const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);

    pendingStudent.emailVerificationOTP = emailOTP;
    pendingStudent.emailVerificationOTPExpires = emailOTPExpires;
    await pendingStudent.save();

    await sendEmailOTP(pendingStudent.email, emailOTP);
    return true;
  }

  // 2. Fallback to existing student (for backward compatibility)
  const student = await Student.findOne({ email });

  if (!student) {
    const error = new Error("Registration session expired or student not found.");
    error.statusCode = 404;
    throw error;
  }

  if (student.isEmailVerified) {
    const error = new Error("Email already verified.");
    error.statusCode = 400;
    throw error;
  }

  const emailOTP = generateOTP();
  const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);

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
  const { mobile, otp } = data;

  // ==========================================
  // Find Student
  // ==========================================

  const student = await Student.findOne({ mobile }).select(
    "+refreshToken",
  );

  if (!student) {
    const error = new Error("Invalid Mobile Number.");
    error.statusCode = 404;
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


  // ==========================================
  // Check OTP
  // ==========================================

  if (!otp) {
    // Send OTP to mobile
    await sendOTP(student.mobile);
    return {
      otpRequired: true,
      message: "OTP sent to your mobile number.",
    };
  }

  // Verify OTP using Twilio
  const verification = await verifyOTP(student.mobile, otp);

  if (verification.status !== "approved") {
    const error = new Error("Invalid OTP.");
    error.statusCode = 400;
    throw error;
  }

  student.isMobileVerified = true;
  student.isEmailVerified = true;

  // Invalidate any other active sessions/devices for single-device login
  student.tokenVersion = (student.tokenVersion || 0) + 1;

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
      selectedClass: student.selectedClass,
      role: student.role,
    },
  };
};

// ==========================================
// LOGIN WITH PASSWORD Student Service
// ==========================================
export const loginStudentWithPasswordService = async (data) => {
  const { mobile, password } = data;

  if (!mobile || !password) {
    const error = new Error("Mobile and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ mobile }).select(
    "+password +refreshToken"
  );

  if (!student) {
    const error = new Error("Invalid Mobile Number or Password.");
    error.statusCode = 401;
    throw error;
  }

  if (!student.isActive) {
    const error = new Error("Your account is inactive.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await student.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid Mobile Number or Password.");
    error.statusCode = 401;
    throw error;
  }

  student.isMobileVerified = true;
  student.isEmailVerified = true;

  // Invalidate any other active sessions/devices for single-device login
  student.tokenVersion = (student.tokenVersion || 0) + 1;

  const accessToken = generateAccessToken(student);
  const refreshToken = generateRefreshToken(student._id);

  student.refreshToken = refreshToken;
  student.lastLogin = new Date();
  student.loginCount += 1;

  await student.save();

  return {
    accessToken,
    refreshToken,
    student: {
      id: student._id,
      fullName: student.fullName,
      mobile: student.mobile,
      selectedClass: student.selectedClass,
      role: student.role,
    },
  };
};

// ==========================================
// Forgot Password Service (Send OTP)
// ==========================================
export const forgotPasswordStudentService = async (mobile) => {
  if (!mobile) {
    const error = new Error("Mobile number is required.");
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findOne({ mobile });
  if (!student) {
    const error = new Error("Student with this mobile number is not registered.");
    error.statusCode = 404;
    throw error;
  }

  if (!student.isActive) {
    const error = new Error("Your account is inactive.");
    error.statusCode = 403;
    throw error;
  }

  // Send OTP to mobile using Twilio Verify service
  await sendOTP(student.mobile);

  return {
    message: "OTP sent to your mobile number.",
  };
};

// ==========================================
// Reset Password Service (Set New Password)
// ==========================================
export const resetPasswordStudentService = async (data) => {
  const { mobile, otp, password } = data;

  if (!mobile || !otp || !password) {
    const error = new Error("Mobile, OTP, and new password are required.");
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify OTP using Twilio Verify
  const verification = await verifyOTP(mobile, otp);

  if (verification.status !== "approved") {
    const error = new Error("Invalid or expired OTP.");
    error.statusCode = 400;
    throw error;
  }

  // 2. Find student and update password
  const student = await Student.findOne({ mobile });
  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  student.password = password;
  await student.save(); // pre-save hook will hash it

  return {
    message: "Password reset successfully. You can now login with your new password.",
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
    .populate({
      path:"selectedClass",
      select: "classNumber"
    })
    .populate("enrolledSubjects.subject")
    .populate("enrolledClasses.classes")

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
  // Validate that Student ID is provided
  if (!studentId) {
    const error = new Error("Student ID is required.");
    error.statusCode = 400;
    throw error;
  }

  // Retrieve the student record from the database
  const student = await Student.findById(studentId);
  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  // Destructure fields parsed and validated by studentUpdateProfile validation schema
  const {
    fullName,
    parentsMobile,
    email,
    address,
    pinCode,
    dob,
    gender,
    schoolName,
    selectedClass,
    notificationEnabled,
    deviceToken,
    deviceType,
  } = data;

  // 1. Update basic information fields if they are supplied in the request body
  if (fullName) student.fullName = fullName;
  if (parentsMobile) student.parentsMobile = parentsMobile;
  if (email) student.email = email;
  if (address) student.address = address;
  if (pinCode) student.pinCode = pinCode;
  if (dob) student.dob = dob;
  if (gender) student.gender = gender;
  if (schoolName) student.schoolName = schoolName;

  // Update notification preferences if supplied (since it's a boolean, check against undefined)
  if (notificationEnabled !== undefined) {
    student.notificationEnabled = notificationEnabled;
  }

  // 2. Manage class updates (if the selectedClass is changing)
  // Since student.selectedClass is stored as a Mongoose ObjectId, we check equality by string conversion
  if (selectedClass && selectedClass.toString() !== (student.selectedClass ? student.selectedClass.toString() : "")) {
    
    // Find the target class in the database to ensure it exists
    const targetClass = await Classes.findById(selectedClass);
    if (!targetClass) {
      const error = new Error("Selected class does not exist.");
      error.statusCode = 404;
      throw error;
    }

    // Decrement the student count of the old class if one was previously selected
    if (student.selectedClass) {
      await Classes.findByIdAndUpdate(student.selectedClass, {
        $inc: { totalStudents: -1 },
      });
    }

    // Increment the student count of the new selected class
    targetClass.totalStudents = (targetClass.totalStudents || 0) + 1;
    await targetClass.save();

    // Assign the new class ObjectId to the student record
    student.selectedClass = targetClass._id;
  }

  // 3. Manage multi-device login mapping to the devices subdocument array
  // If the mobile/web app passes deviceToken and deviceType, we register/update the device
  if (deviceToken && deviceType) {
    // Ensure devices array is initialized
    student.devices = student.devices || [];

    // Check if the device is already registered under this student's account
    const existingDeviceIndex = student.devices.findIndex(
      (device) => device.deviceToken === deviceToken
    );

    if (existingDeviceIndex > -1) {
      // Device is already registered; update its lastActiveAt timestamp to keep it fresh
      student.devices[existingDeviceIndex].lastActiveAt = new Date();
    } else {
      // New device; push it to the devices array
      student.devices.push({
        deviceToken,
        deviceType,
        lastActiveAt: new Date(),
      });

      // Limit array size to maximum 5 active devices to prevent database document bloat
      if (student.devices.length > 5) {
        student.devices.shift(); // Remove the oldest device (first element)
      }
    }
  }

  // Save changes to MongoDB
  await student.save();

  // Return the fully updated and populated student document
  return Student.findById(studentId)
    .populate("selectedClass")
    .populate("enrolledSubjects.subject")
    .populate("enrolledClasses.classes");
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

// ==========================================
// ENROLL STUDENT SERVICE
// ==========================================

// export const enrollStudentService = async (studentId, data) => {
//   const { type, id, paymentId, amountPaid } = data;

//   if (!type || !id) {
//     const error = new Error(
//       "Enrollment type ('subject' or 'classes') and target ID are required.",
//     );
//     error.statusCode = 400;
//     throw error;
//   }

//   // Payment check
//   if (!paymentId || amountPaid === undefined || Number(amountPaid) < 0) {
//     const error = new Error(
//       "Valid payment details (paymentId, amountPaid) are required for enrollment.",
//     );
//     error.statusCode = 400;
//     throw error;
//   }

//   const student = await Student.findById(studentId);
//   if (!student) {
//     const error = new Error("Student not found.");
//     error.statusCode = 404;
//     throw error;
//   }

//   if (type === "subject") {
//     const subject = await Subject.findById(id);
//     if (!subject || !subject.isActive) {
//       const error = new Error("Subject not found or inactive.");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Check if student is already enrolled in the subject
//     const isEnrolled = student.enrolledSubjects.some(
//       (item) => item.subject.toString() === subject._id.toString(),
//     );

//     if (isEnrolled) {
//       const error = new Error("Already enrolled in this subject.");
//       error.statusCode = 400;
//       throw error;
//     }

//     student.enrolledSubjects.push({
//       subject: subject._id,
//       enrolledAt: new Date(),
//       paymentId,
//       amountPaid,
//       paymentStatus: "Completed",
//     });
//   } else if (type === "classes") {
//     const classes = await Classes.findById(id);
//     if (!classes || !classes.isActive) {
//       const error = new Error("Class not found or inactive.");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Check if student is already enrolled in the class
//     const isEnrolledInClass = student.enrolledClasses.some(
//       (item) => item.classes.toString() === classes._id.toString(),
//     );

//     if (isEnrolledInClass) {
//       const error = new Error("Already enrolled in this class.");
//       error.statusCode = 400;
//       throw error;
//     }

//     student.enrolledClasses.push({
//       classes: classes._id,
//       enrolledAt: new Date(),
//       paymentId,
//       amountPaid,
//       paymentStatus: "Completed",
//     });

//     // Find all active subjects of this class
//     const subjects = await Subject.find({ classes: classes._id, isActive: true });

//     // Add each subject to enrolledSubjects if not already present
//     for (const subj of subjects) {
//       const isAlreadyEnrolled = student.enrolledSubjects.some(
//         (item) => item.subject.toString() === subj._id.toString(),
//       );

//       if (!isAlreadyEnrolled) {
//         student.enrolledSubjects.push({
//           subject: subj._id,
//           enrolledAt: new Date(),
//           paymentId,
//           amountPaid: 0, // Individual subject paid via class enrollment
//           paymentStatus: "Completed",
//         });
//       }
//     }

//     // Increment totalStudents count for the enrolled class
//     classes.totalStudents = (classes.totalStudents || 0) + 1;
//     await classes.save();
//   } else {
//     const error = new Error(
//       "Invalid enrollment type. Must be 'subject' or 'classes'.",
//     );
//     error.statusCode = 400;
//     throw error;
//   }

//   await student.save();


//   return Student.findById(studentId)
//     .populate("selectedClass")
//     .populate("enrolledSubjects.subject")
//     .populate("enrolledClasses.classes");
// };

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

  if (!student.isActive) {
    const error = new Error("Account is inactive.");
    error.statusCode = 403;
    error.code = "ACCOUNT_INACTIVE";
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
