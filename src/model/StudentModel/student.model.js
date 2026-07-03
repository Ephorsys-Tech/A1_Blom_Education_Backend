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

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
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

    // ==========================================
    // BATCH
    // ==========================================

    selectedBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    // ==========================================
    // ROLE
    // ==========================================

    role: {
      type: String,
      default: "student",
      enum: ["student"],
    },

    // ==========================================
    // MOBILE VERIFICATION
    // ==========================================

    isMobileVerified: {
      type: Boolean,
      default: false,
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

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // DEVICE INFO
    // ==========================================

    deviceToken: {
      type: String,
      default: "",
    },

    deviceType: {
      type: String,
      enum: ["android", "ios"],
    },

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
    // ENROLLED COURSES (🔥 MAIN ADDITION)
    // ==========================================

    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },

        enrolledAt: {
          type: Date,
          default: Date.now,
        },

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
  },
  {
    timestamps: true,
  },
);

// ==========================================
// HASH PASSWORD
// ==========================================

studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
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
