// import { sendMail } from "../config/sendMail.js";
import { sendMail } from "../utils/sendMail.js";
import { managerAccessTemplate } from "../utils/mailTemplates/managerAccessTemplate.js";
import AdminModel from "../model/admin.model.js";
import generateToken from "../utils/generateToken.js";
// -----------------------------------------------------
// @description -   Register Admin
// @route -   POST /api/v1/admin/register
// @access -  Public
// -----------------------------------------------------

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All Feilds are Required",
      });
    }

    // --------------------------------------------
    // Check Existing Admin
    // --------------------------------------------
    const existingAdmin = await AdminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin Already Exists",
      });
    }

    // --------------------------------------------
    // Create Admin
    // --------------------------------------------
    const admin = await AdminModel.create({
      name,
      email,
      password,
    });

    //---------------------------------------------
    // Remove Password from Response
    //---------------------------------------------
    const adminData = await AdminModel.findById(admin._id).select("-password");

    //---------------------------------------------
    // Final Response
    //----------------------------------------------
    return res.status(201).json({
      success: true,
      message: "Admin Registered Successfully",
      data: adminData,
    });
  } catch (error) {
    console.error("Register Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//-------------------------------------------------------
//@description - Login Admin
//@route - POST  /api/v1/admin/login
//@access Public
//-------------------------------------------------------

export const loginAdmin = async (req, res) => {
  try {
    // --------------------------------------------
    // Get Email & Password
    // --------------------------------------------
    const { email, password } = req.body;

    // --------------------------------------------
    // Validation
    // --------------------------------------------
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are Required",
      });
    }

    // --------------------------------------------
    // Find Admin already exist or Not (by Email or UserId)
    // --------------------------------------------
    const admin = await AdminModel.findOne({ 
      $or: [{ email: email }, { userId: email }] 
    });
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin or Manager Not Found",
      });
    }

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked. Please contact the main admin.",
      });
    }

    // ---------------------------------------------
    // Compare Password
    // ----------------------------------------------
    const isPasswordMatched = await admin.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // ---------------------------------------------
    // Generate Token
    // ----------------------------------------------
    const token = generateToken(admin._id);

    // ---------------------------------------------
    // Cookie Options
    // ----------------------------------------------
    const cookieOption = {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // ---------------------------------------------
    // Store Token in Cookie
    // ----------------------------------------------
    res.cookie("token", token, cookieOption);

    // ---------------------------------------------
    // Login Response
    // ----------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Login Successful",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//-------------------------------------------------------
//@description - Logout Admin
//@route - POST  /api/v1/admin/logout
//@access Private
//-------------------------------------------------------

export const LogoutAdmin = async (req, res) => {
  try {
    // ------------------------------------------
    // Clear Auth Cookie
    // ------------------------------------------

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true in production
    });

    // ------------------------------------------
    // Success Response
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Logout Successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//-------------------------------------------------------
//@description - Get Admin Profile
//@route - GET /api/v1/admin/profile
//@access Private
//-------------------------------------------------------

export const getAdminProfile = async (req, res) => {
  try {
    // --------------------------------------------
    // Find Admin already exist or Not
    // --------------------------------------------
    const admin = await AdminModel.findById(req.admin._id).select("-password");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    // ------------------------------------------
    // Success Response
    // ------------------------------------------
    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// FORGOT PASSWORD - SEND OTP
// ======================================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ==========================================
    // FIND ADMIN
    // ==========================================

    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // ==========================================
    // GENERATE OTP
    // ==========================================

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.resetOtp = otp;

    admin.resetOtpExpire = Date.now() + 10 * 60 * 1000;

    await admin.save();

    // ==========================================
    // SEND MAIL
    // ==========================================

    // await sendMail(
    //   admin.email,
    //   "Password Reset OTP",
    //   `
    //   <div style="font-family: Arial, sans-serif;">
    //     <h2>Password Reset Request</h2>

    //     <p>Hello ${admin.name},</p>

    //     <p>Your OTP for password reset is:</p>

    //     <h1 style="color:#2563eb">${otp}</h1>

    //     <p>This OTP is valid for 10 minutes.</p>

    //     <p>If you didn't request this, ignore this email.</p>
    //   </div>
    //   `,
    // );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR :", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// RESET PASSWORD
// ======================================================

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !otp || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password must match",
      });
    }

    // ==========================================
    // FIND ADMIN
    // ==========================================

    const admin = await AdminModel.findOne({
      email,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // ==========================================
    // CHECK OTP
    // ==========================================

    if (admin.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ==========================================
    // CHECK OTP EXPIRY
    // ==========================================

    if (!admin.resetOtpExpire || admin.resetOtpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // ==========================================
    // UPDATE PASSWORD
    // ==========================================

    admin.password = password;

    admin.resetOtp = undefined;

    admin.resetOtpExpire = undefined;

    await admin.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("RESET PASSWORD ERROR :", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GIVE ACCESS (CREATE MANAGERS)
// ======================================================

export const giveAccess = async (req, res) => {
  try {
    // ------------------------------------------
    // Check if requester is Admin
    // ------------------------------------------
    if (req.admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Only Admin can perform this action",
      });
    }

    const { name, email, password, role, userId } = req.body;

    // ------------------------------------------
    // Validation
    // ------------------------------------------
    if (!name || !email || !password || !role || !userId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (name, email, password, role, userId)",
      });
    }

    const validRoles = ["web-manager", "app-manager"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'web-manager' or 'app-manager'",
      });
    }

    // ------------------------------------------
    // Check Existing User
    // ------------------------------------------
    const existingUser = await AdminModel.findOne({ 
      $or: [{ email: email }, { userId: userId }] 
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or User ID already exists",
      });
    }

    // ------------------------------------------
    // Create Manager
    // ------------------------------------------
    const manager = await AdminModel.create({
      name,
      email,
      password,
      role,
      userId,
    });

    const managerData = await AdminModel.findById(manager._id).select("-password");

    // ------------------------------------------
    // Send Email to Manager
    // ------------------------------------------
    const { emailSubject, emailHtml } = managerAccessTemplate(role, name, userId, email, password);

    // Attempt to send email, but don't fail the request if it fails
    // Assuming sendMail is configured properly in .env
    await sendMail(email, emailSubject, emailHtml);

    // ------------------------------------------
    // Success Response
    // ------------------------------------------
    return res.status(201).json({
      success: true,
      message: "Manager created successfully",
      data: managerData,
    });

  } catch (error) {
    console.error("Give Access Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL MANAGERS
// ======================================================
export const getAllManagers = async (req, res) => {
  try {
    if (req.admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }
    const managers = await AdminModel.find({ role: { $in: ["web-manager", "app-manager"] } }).select("-password");
    return res.status(200).json({ success: true, data: managers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// TOGGLE BLOCK MANAGER
// ======================================================
export const toggleBlockManager = async (req, res) => {
  try {
    if (req.admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }
    const { id } = req.params;
    const manager = await AdminModel.findById(id);
    if (!manager || manager.role === "admin") {
      return res.status(404).json({ success: false, message: "Manager not found" });
    }
    manager.isBlocked = !manager.isBlocked;
    await manager.save();
    return res.status(200).json({ success: true, message: `Manager ${manager.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: manager });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// DELETE MANAGER
// ======================================================
export const deleteManager = async (req, res) => {
  try {
    if (req.admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }
    const { id } = req.params;
    const manager = await AdminModel.findByIdAndDelete(id);
    if (!manager) {
      return res.status(404).json({ success: false, message: "Manager not found" });
    }
    return res.status(200).json({ success: true, message: "Manager deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
