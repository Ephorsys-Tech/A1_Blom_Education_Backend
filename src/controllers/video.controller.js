import VideoModel from "../model/video.model.js";

// Upload Video
export const uploadVideo = async (req, res) => {
  try {
    const { title, videoUrl, description, isPublic } = req.body;

    if (!title || !videoUrl || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, video URL, and description are required",
      });
    }

    const video = await VideoModel.create({
      title,
      videoUrl,
      description,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: video,
    });
  } catch (error) {
    console.error("Upload Video Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while uploading video",
    });
  }
};

// Delete Video
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

// Get All Videos (Admin)
export const getAllVideos = async (req, res) => {
  try {
    const videos = await VideoModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (error) {
    console.error("Get All Videos Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching videos",
    });
  }
};

// Get Public Videos
export const getPublicVideos = async (req, res) => {
  try {
    const videos = await VideoModel.find({ isPublic: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (error) {
    console.error("Get Public Videos Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching public videos",
    });
  }
};

// Toggle Video Visibility Status
export const toggleVideoStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await VideoModel.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Toggle status
    video.isPublic = !video.isPublic;
    await video.save();

    return res.status(200).json({
      success: true,
      message: "Video status updated successfully",
      data: video,
    });
  } catch (error) {
    console.error("Toggle Video Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating video status",
    });
  }
};
