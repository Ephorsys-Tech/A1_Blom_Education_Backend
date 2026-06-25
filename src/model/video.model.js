import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
    },
    link: {
      type: String,
      required: [true, "Video link is required"],
    },
    description: {
      type: String,
      required: [true, "Video description is required"],
    },
  },
  { timestamps: true }
);

const VideoModel = mongoose.model("Video", videoSchema);

export default VideoModel;
