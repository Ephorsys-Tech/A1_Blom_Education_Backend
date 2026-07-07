import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin Name is Required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Admin Email is Required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["admin", "web-manager", "app-manager"],
      default: "admin",
    },

    userId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ======================================
    // EMAIL VERIFICATION (Registration)
    // ======================================

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOtp: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationOtpExpire: {
      type: Date,
      default: null,
      select: false,
    },

    // ======================================
    // FORGOT PASSWORD OTP
    // ======================================

    resetOtp: {
      type: String,
      default: null,
      select: false,
    },

    resetOtpExpire: {
      type: Date,
      default: null,
      select: false,
    },

    // ======================================
    // REFRESH TOKEN
    // ======================================
    refreshToken: {
      type: String,
      default: "",
      select: false,
    },
  },
  {
    timestamps: true,
  },
);



// ======================================
// HASH PASSWORD
// ======================================

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// ======================================
// COMPARE PASSWORD
// ======================================

adminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const AdminModel = mongoose.model("Admin", adminSchema);

export default AdminModel;
