import ReelModel from "../../model/webModel/reel.model.js";
import { uploadBufferToS3, deleteFileFromS3 } from "../../utils/s3Helper.js";
import path from "path";

// Upload Reel
export const uploadReel = async (req, res) => {
  try {
    const { title, videoUrl } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Instagram Reel Link is required",
      });
    }

    let thumbnailUrl = "";
    let thumbnailPublicId = "";

    // Upload thumbnail cover image to S3 if provided
    if (req.file) {
      const ext = path.extname(req.file.originalname || "") || ".jpg";
      const s3Key = `reels/thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const uploadResult = await uploadBufferToS3(req.file.buffer, s3Key, req.file.mimetype || "image/jpeg");
      thumbnailUrl = uploadResult.url;
      thumbnailPublicId = uploadResult.key;
    }

    const reel = await ReelModel.create({
      title,
      videoUrl, // Storing Instagram Link
      thumbnailUrl,
      thumbnailPublicId,
      videoPublicId: "",
      duration: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Reel added successfully",
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

    // Delete thumbnail from S3
    if (reel.thumbnailPublicId || reel.thumbnailUrl) {
      await deleteFileFromS3(reel.thumbnailPublicId || reel.thumbnailUrl);
    }

    // Delete legacy video if any exists
    if (reel.videoPublicId) {
      await deleteFileFromS3(reel.videoPublicId);
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

// Update Reel
export const updateReel = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, videoUrl } = req.body;

    const reel = await ReelModel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    if (title) reel.title = title.trim();
    if (videoUrl) reel.videoUrl = videoUrl.trim();

    // If new thumbnail cover image is uploaded
    if (req.file) {
      // Delete old thumbnail from S3 if it exists
      if (reel.thumbnailPublicId || reel.thumbnailUrl) {
        await deleteFileFromS3(reel.thumbnailPublicId || reel.thumbnailUrl);
      }

      // Upload new thumbnail to S3
      const ext = path.extname(req.file.originalname || "") || ".jpg";
      const s3Key = `reels/thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const uploadResult = await uploadBufferToS3(req.file.buffer, s3Key, req.file.mimetype || "image/jpeg");
      reel.thumbnailUrl = uploadResult.url;
      reel.thumbnailPublicId = uploadResult.key;
    }

    await reel.save();

    return res.status(200).json({
      success: true,
      message: "Reel updated successfully",
      data: reel,
    });
  } catch (error) {
    console.error("Update Reel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating reel",
      error: error.message,
    });
  }
};
