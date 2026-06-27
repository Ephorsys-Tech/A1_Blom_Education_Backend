import ReelModel from "../model/reel.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// Upload Reel
export const uploadReel = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    // Upload video to Cloudinary
    // We specify resourceType: "video" to ensure Cloudinary parses it as a video
    const uploadResult = await uploadToCloudinary(req.file.buffer, "reels", "video");

    const duration = uploadResult.duration;

    // Check duration. Allowing a tiny grace threshold (e.g. 30.5 seconds) or strictly 30.
    if (duration && duration > 30.5) {
      // Delete immediately from Cloudinary
      await deleteFromCloudinary(uploadResult.publicId, "video");

      return res.status(400).json({
        success: false,
        message: `Video duration is ${Math.round(duration)} seconds. Reels must be 30 seconds or less.`,
      });
    }

    const reel = await ReelModel.create({
      title,
      videoUrl: uploadResult.url,
      videoPublicId: uploadResult.publicId,
      duration: duration || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Reel uploaded successfully",
      data: reel,
    });
  } catch (error) {
    console.error("Upload Reel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while uploading reel",
      error: error.message,
    });
  }
};

// Delete Reel
export const deleteReel = async (req, res) => {
  try {
    const { id } = req.params;

    const reel = await ReelModel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    // Delete from Cloudinary
    if (reel.videoPublicId) {
      await deleteFromCloudinary(reel.videoPublicId, "video");
    }

    // Delete from Database
    await ReelModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Reel deleted successfully",
    });
  } catch (error) {
    console.error("Delete Reel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting reel",
      error: error.message,
    });
  }
};

// Get All Reels
export const getReels = async (req, res) => {
  try {
    const reels = await ReelModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: reels,
    });
  } catch (error) {
    console.error("Get Reels Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching reels",
      error: error.message,
    });
  }
};
