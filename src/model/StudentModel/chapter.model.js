import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Chapter name is required"],
      trim: true,
    },

    chapterNumber: {
      type: Number,
      required: [true, "Chapter number is required"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course/Subject reference is required"],
    },

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

// Compound index to ensure unique chapter number per Course/Subject
chapterSchema.index({ course: 1, chapterNumber: 1 }, { unique: true });

export default mongoose.model("Chapter", chapterSchema);
