import VideoModel from "../model/video.model.js";
import { uploadVideoOnCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js";

export const uploadVideo = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title ) {
      return res.status(400).json({
        success: false,
        message: "Title are required",
      });
    }

    const videoLocalPath = req.file?.path;

    if (!videoLocalPath) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    const cloudinaryResponse = await uploadVideoOnCloudinary(videoLocalPath);

    if (!cloudinaryResponse) {
      return res.status(500).json({
        success: false,
        message: "Error uploading video to Cloudinary",
      });
    }

    const video = await VideoModel.create({
      title,
      videoUrl: cloudinaryResponse.secure_url,
      public_id: cloudinaryResponse.public_id,
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video,
    });
  } catch (error) {
    console.error("Upload Video Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while uploading video",
    });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await VideoModel.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Delete from Cloudinary
    await deleteVideoFromCloudinary(video.public_id);

    // Delete from Database
    await VideoModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete Video Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting video",
    });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const videos = await VideoModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get All Videos Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching videos",
    });
  }
};
