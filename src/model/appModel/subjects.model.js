import mongoose from "mongoose";

const subjectsSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },

    code: {
      type: String,
      required: [true, "Subject code is required"],
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
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
    // PRICING
    // ==========================================

    price: {
      type: Number,
      required: [true, "Subject price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: [0, "Discount price cannot be negative"],
    },

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    classes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classes",
      required: [true, "Class reference is required"],
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Subject", subjectsSchema);
