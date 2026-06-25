import VideoModel from "../model/video.model.js";

export const uploadVideo = async (req, res) => {
  try {
    const { title, link, description } = req.body;

    if (!title || !link || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, link, and description are required",
      });
    }

    const video = await VideoModel.create({
      title,
      link,
      description,
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
