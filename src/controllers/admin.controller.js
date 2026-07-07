import {
  registerAdminService,
  verifyAdminEmailService,
  resendAdminOtpService,
  loginAdminService,
  logoutAdminService,
  refreshAdminTokenService,
  getAdminProfileService,
  forgotPasswordService,
  resetPasswordService,
  getAllManagersService,
  toggleBlockManagerService,
  deleteManagerService,
  updateManagerPasswordService
} from "../services/admin.service.js";

//-------------------------------------------------------
//@description - Register Admin
//@route - POST /api/v1/admin/register
//@access Public
//-------------------------------------------------------
export const registerAdmin = async (req, res, next) => {
  try {
    const adminData = await registerAdminService(req.body);

    return res.status(201).json({
      success: true,
      message: "Admin Registered Successfully. OTP sent to your email for verification.",
      data: adminData,
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Verify Admin Email OTP
//@route - POST /api/v1/admin/verify-email
//@access Public
//-------------------------------------------------------
export const verifyAdminEmail = async (req, res, next) => {
  try {
    const adminData = await verifyAdminEmailService(req.body);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: adminData,
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Resend Admin Registration OTP
//@route - POST /api/v1/admin/resend-otp
//@access Public
//-------------------------------------------------------
export const resendAdminOtp = async (req, res, next) => {
  try {
    await resendAdminOtpService(req.body);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully.",
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Login Admin
//@route - POST /api/v1/admin/login
//@access Public
//-------------------------------------------------------
export const loginAdmin = async (req, res, next) => {
  try {
    const result = await loginAdminService(req.body);

    // Cookie Options for Access Token (10m)
    const accessCookieOption = {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    };

    // Cookie Options for Refresh Token (1d)
    const refreshCookieOption = {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    };

    // Set cookies
    res.cookie("accessToken", result.accessToken, accessCookieOption);
    res.cookie("refreshToken", result.refreshToken, refreshCookieOption);

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      data: result.admin,
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Logout Admin
//@route - POST /api/v1/admin/logout
//@access Private
//-------------------------------------------------------
export const LogoutAdmin = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken || req.cookies.token;
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    await logoutAdminService(token);

    // Clear Auth Cookies
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    };
    res.clearCookie("token", cookieOptions);
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logout Successful",
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Refresh Admin Token
//@route - POST /api/v1/admin/refresh-token
//@access Public
//-------------------------------------------------------
export const refreshAdminToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.body.refreshToken || req.cookies.refreshToken;

    const result = await refreshAdminTokenService(incomingRefreshToken);

    // Cookie Options for Access Token (10m)
    const accessCookieOption = {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    };

    res.cookie("accessToken", result.accessToken, accessCookieOption);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Get Admin Profile
//@route - GET /api/v1/admin/profile
//@access Private
//-------------------------------------------------------
export const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await getAdminProfileService(req.admin._id);

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Forgot Password
//@route - POST /api/v1/admin/forgot-password
//@access Public
//-------------------------------------------------------
export const forgotPassword = async (req, res, next) => {
  try {
    await forgotPasswordService(req.body.email);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Reset Password
//@route - POST /api/v1/admin/reset-password
//@access Public
//-------------------------------------------------------
export const resetPassword = async (req, res, next) => {
  try {
    await resetPasswordService(req.body);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Give Access (Create Managers)
//@route - POST /api/v1/admin/give-access
//@access Private
//-------------------------------------------------------
export const giveAccess = async (req, res, next) => {
  try {
    const managerData = await giveAccessService(req.admin.role, req.body);

    return res.status(201).json({
      success: true,
      message: "Manager created successfully",
      data: managerData,
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Get All Managers
//@route - GET /api/v1/admin/managers
//@access Private
//-------------------------------------------------------
export const getAllManagers = async (req, res, next) => {
  try {
    const managers = await getAllManagersService(req.admin.role);

    return res.status(200).json({
      success: true,
      data: managers,
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Toggle Block Manager
//@route - PATCH /api/v1/admin/managers/:id/block
//@access Private
//-------------------------------------------------------
export const toggleBlockManager = async (req, res, next) => {
  try {
    const manager = await toggleBlockManagerService(req.admin.role, req.params.id);

    return res.status(200).json({
      success: true,
      message: `Manager ${manager.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: manager,
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Delete Manager
//@route - DELETE /api/v1/admin/managers/:id
//@access Private
//-------------------------------------------------------
export const deleteManager = async (req, res, next) => {
  try {
    await deleteManagerService(req.admin.role, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Manager deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//-------------------------------------------------------
//@description - Update Manager Password
//@route - PATCH /api/v1/admin/managers/:id/update-password
//@access Private (Admin only)
//-------------------------------------------------------
export const updateManagerPassword = async (req, res, next) => {
  try {
    await updateManagerPasswordService(req.admin.role, req.params.id, req.body.password);

    return res.status(200).json({
      success: true,
      message: "Manager password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
