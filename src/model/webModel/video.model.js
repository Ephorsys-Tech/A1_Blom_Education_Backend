import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    description: {
      type: String,
      required: [true, "Video description is required"],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const VideoModel = mongoose.model("Video", videoSchema);

export default VideoModel;
