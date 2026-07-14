import { respond } from "../../utils/respond.js";
import {
  getMyProfileService,
  loginStudentService,
  logoutStudentService,
  registerStudentService,
  resendMobileOTPService,
  updateProfileService,
  verifyMobileOTPService,
  // enrollStudentService,
  refreshAccessTokenService,
  verifyEmailOTPService,
  resendEmailOTPService,
} from "../../services/student.service.js";
import {
  studentLogin,
  studentRegister,
} from "../../validations/student.validation.js";

// ==========================================
// Register Student
// ==========================================
export const registerStudent = async (req, res, next) => {
  try {
    const result = studentRegister.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const student = await registerStudentService(result.data);

    return res.status(201).json({
      success: true,
      message: "Student Registered Successfully. OTP sent to your mobile.",
      student,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Verify Mobile OTP
// ==========================================
export const verifyMobileOTP = async (req, res, next) => {
  try {
    const result = await verifyMobileOTPService(req.body);

    // Cookie Options for Student Access Token (15m)
    const accessCookieOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    };

    // Cookie Options for Student Refresh Token (30d)
    const refreshCookieOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };

    // Set cookies in response
    res.cookie("accessToken", result.accessToken, accessCookieOption);
    res.cookie("refreshToken", result.refreshToken, refreshCookieOption);

    return res.status(200).json({
      success: true,
      message: "Mobile verified successfully. Login successful.",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      student: result.student,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Resend Mobile OTP
// ==========================================
export const resendMobileOTP = async (req, res, next) => {
  try {
    await resendMobileOTPService(req.body);
    return respond(res, 200, "OTP sent successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Verify Email OTP
// ==========================================
export const verifyEmailOTP = async (req, res, next) => {
  try {
    const result = await verifyEmailOTPService(req.body);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      result,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Resend Email OTP
// ==========================================
export const resendEmailOTP = async (req, res, next) => {
  try {
    await resendEmailOTPService(req.body);
    return respond(res, 200, "OTP sent successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Login Student
// ==========================================
export const loginStudent = async (req, res, next) => {
  try {
    const result = studentLogin.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const loginResult = await loginStudentService(result.data);

    if (loginResult.otpRequired) {
      return res.status(200).json({
        success: true,
        message: loginResult.message,
        otpRequired: true,
      });
    }

    // Cookie Options for Student Access Token (15m)
    const accessCookieOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRE),
    };

    const refreshCookieOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRE),
    };


    // Set cookies in response if login succeeded directly
    res.cookie("accessToken", loginResult.accessToken, accessCookieOption);
    res.cookie("refreshToken", loginResult.refreshToken, refreshCookieOption);

    return res.status(200).json({
      success: true,
      message: "Login Successfully.",
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      student: loginResult.student,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET MY PROFILE CONTROLLER
// ==========================================
export const getMyProfile = async (req, res, next) => {
  try {
    const student = await getMyProfileService(req.student._id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      student,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE PROFILE CONTROLLER
// ==========================================
export const updateProfile = async (req, res, next) => {
  try {
    const student = await updateProfileService(req.student._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      student,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LOGOUT CONTROLLER
// ==========================================
export const logoutStudent = async (req, res, next) => {
  try {
    await logoutStudentService(req.student._id);

    // Clear cookies upon logout
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return respond(res, 200, "Logout successful.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ENROLL STUDENT CONTROLLER
// ==========================================
// export const enrollStudent = async (req, res, next) => {
//   try {
//     const result = await enrollStudentService(req.student._id, req.body);

//     return res.status(200).json({
//       success: true,
//       message: `Successfully enrolled in ${req.body.type || "item"}.`,
//       student: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// ==========================================
// Refresh Access Token
// ==========================================
export const refreshAccessToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.body.refreshToken || req.cookies.refreshToken;

    const result = await refreshAccessTokenService(incomingRefreshToken);

    // Cookie Options for Student Access Token (15m)
    const accessCookieOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    };

    res.cookie("accessToken", result.accessToken, accessCookieOption);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      accessToken: result.accessToken,
    });
  } catch (error) {
    // Errors thrown by the service carry statusCode + code
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "SERVER_ERROR",
      message: error.message || "Something went wrong.",
    });
  }
};
