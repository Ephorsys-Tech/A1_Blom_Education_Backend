import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFO
    // ==========================================

    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
      minlength: 3,
      maxlength: 60,
    },

    mobile: {
      type: String,
      required: [true, "Mobile Number is required"],
      unique: true,
      trim: true,
    },

    parentsMobile: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    pinCode: {
      type: String,
      required: [true, "PIN code required"],
      trim: true,
      match: [/^\d{6}$/, "PIN code must be exactly 6 digits"],
    },

    dob: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },

    avatar: {
      public_id: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    schoolName: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // CLASS
    // ==========================================

    selectedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classes",
    },

    // ==========================================
    // TOKEN VERSION (used to invalidate access tokens instantly)
    // ==========================================

    tokenVersion: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // MOBILE VERIFICATION (OTP)
    // ==========================================

    isMobileVerified: {
      type: Boolean,
      default: false,
    },

    mobileVerificationOTP: {
      type: String,
      select: false,
    },

    mobileVerificationOTPExpires: {
      type: Date,
      select: false,
    },

    // ==========================================
    // EMAIL VERIFICATION (OTP)
    // ==========================================

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOTP: {
      type: String,
      select: false,
    },

    emailVerificationOTPExpires: {
      type: Date,
      select: false,
    },

    // ==========================================
    // PASSWORD RESET (forgot password flow)
    // ==========================================

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // ==========================================
    // AUTH TOKENS
    // ==========================================

    refreshToken: {
      type: String,
      default: "",
      select: false,
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },


    // ==========================================
    // DEVICE INFO (array — supports multiple logged-in devices,
    // needed for push notifications going to app + web etc.)
    // ==========================================

    devices: [
      {
        deviceToken: { type: String, required: true },
        deviceType: { type: String, enum: ["android", "ios", "web"], required: true },
        lastActiveAt: { type: Date, default: Date.now },
      },
    ],

    lastLogin: {
      type: Date,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    notificationEnabled: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // PAYMENT PROVIDER LINK (optional — only if you want
    // saved-card / recurring support later; not required for
    // one-off order+verify flow)
    // ==========================================

    razorpayCustomerId: {
      type: String,
      default: "",
    },

    // ==========================================
    // TERMS
    // ==========================================

    acceptedTerms: {
      type: Boolean,
      default: false,
    },

    acceptedTermsAt: {
      type: Date,
    },

    // ==========================================
    // ENROLLED SUBJECTS
    // Payment details (amount, status, razorpay ids) live ONLY in
    // the Payment collection — query it by { student, targetId }
    // when you need payment history. Keeping a copy here means two
    // sources of truth that can drift (e.g. on refund).
    // ==========================================

    enrolledSubjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },

        enrolledAt: {
          type: Date,
          default: Date.now,
        },

        // Denormalized cache, kept in sync by progress.service's
        // getSubjectProgressService — do not write to this directly
        // from request handlers.
        progress: {
          type: Number,
          default: 0, // 0 - 100
        },

        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ==========================================
    // ENROLLED CLASSES
    // Same rule as above — no payment fields here.
    // ==========================================

    enrolledClasses: [
      {
        classes: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Classes",
          required: true,
        },

        enrolledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        if (
          ret.selectedClass &&
          typeof ret.selectedClass === "object" &&
          ret.selectedClass.classNumber !== undefined
        ) {
          ret.selectedClass = ret.selectedClass.classNumber;
        }
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        if (
          ret.selectedClass &&
          typeof ret.selectedClass === "object" &&
          ret.selectedClass.classNumber !== undefined
        ) {
          ret.selectedClass = ret.selectedClass.classNumber;
        }
        return ret;
      },
    },
  },
);

// ==========================================
// INDEXES
// ==========================================

// Speeds up admin dashboard search (getAllStudentsService with `search`)
studentSchema.index({ fullName: "text", email: "text", mobile: "text" });

// Speeds up "is this student enrolled in subject X" checks
studentSchema.index({ "enrolledSubjects.subject": 1 });
studentSchema.index({ "enrolledClasses.classes": 1 });

// ==========================================
// HASH PASSWORD
// ==========================================

studentSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ==========================================
// COMPARE PASSWORD
// ==========================================

studentSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model("Student", studentSchema);

export default Student;