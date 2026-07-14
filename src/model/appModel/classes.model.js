import mongoose, { mongo } from "mongoose";

const classesSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    classNumber: {
      type: Number,
      required: [true, "Class number is required"],
      unique: true,
      enum: [6, 7, 8, 9, 10],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    thumbnail: {
      public_id: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },

    // ==========================================
    // SETTINGS
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "Class price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPrice: {
      type: Number,
      min:0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    // ==========================================
    // METADATA
    // ==========================================

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Students",
      },
    ],

    // Subscription relation should be here..
    subscriptions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription", // It may change according to the name declared for the razorpay schema name
    }],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Classes", classesSchema);
