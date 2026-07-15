import mongoose, { mongo } from "mongoose";

const classesSchema = new mongoose.Schema(
  {
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

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Classes", classesSchema);
