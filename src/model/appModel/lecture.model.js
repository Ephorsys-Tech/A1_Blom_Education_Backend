import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: "",
    },

    videoUrl: {
      type: String,
      required: [true, "Lecture video URL is required"],
    },

    duration: {
      type: Number,
      default: 0, // In seconds
    },

    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter reference is required"],
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject reference is required"],
    },
    classes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classes",
      required: [true, "Class reference is required"],
    },

    isPreview: {
      type: Boolean,
      default: false, // If true, non-purchased/unenrolled students can play this video
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

export default mongoose.model("Lecture", lectureSchema);
