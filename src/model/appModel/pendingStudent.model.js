import mongoose from "mongoose";

const pendingStudentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
    },

    mobile: {
      type: String,
      required: [true, "Mobile Number is required"],
      trim: true,
    },

    parentsMobile: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    pinCode: {
      type: String,
      required: [true, "PIN code is required"],
      trim: true,
    },

    dob: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },

    schoolName: {
      type: String,
      trim: true,
      default: "",
    },

    selectedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classes",
      required: [true, "Selected class is required"],
    },

    acceptedTerms: {
      type: Boolean,
      required: [true, "Accepted terms is required"],
    },

    acceptedTermsAt: {
      type: Date,
      default: Date.now,
    },

    emailVerificationOTP: {
      type: String,
      required: true,
    },

    emailVerificationOTPExpires: {
      type: Date,
      required: true,
    },

    mobileVerificationOTP: {
      type: String,
    },

    mobileVerificationOTPExpires: {
      type: Date,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isMobileVerified: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes TTL
    },
  },
  {
    timestamps: true,
  }
);

const PendingStudent = mongoose.model("PendingStudent", pendingStudentSchema);

export default PendingStudent;
