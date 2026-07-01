import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Reel title is required"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    videoPublicId: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
    },
    thumbnailUrl: {
      type: String,
    },
    thumbnailPublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ReelModel = mongoose.model("Reel", reelSchema);
export default ReelModel;
