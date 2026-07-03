import AnnouncementModel from "../model/announcement.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// Create Announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, link, isActive } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    let imageUrl = "";
    let imagePublicId = "";

    // Upload image if provided
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "announcements", "image");
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.publicId;
    }

    const shouldBeActive = isActive === "true" || isActive === true;

    // If this announcement is active, deactivate all others so only one is active at a time
    if (shouldBeActive) {
      await AnnouncementModel.updateMany({}, { isActive: false });
    }

    const announcement = await AnnouncementModel.create({
      title,
      description: description || "",
      imageUrl,
      imagePublicId,
      link: link || "",
      isActive: shouldBeActive,
    });

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Create Announcement Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating announcement",
      error: error.message,
    });
  }
};

// Get All Announcements (Admin)
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await AnnouncementModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Get All Announcements Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching announcements",
      error: error.message,
    });
  }
};

// Get Active Announcement for Popup (Public)
export const getActiveAnnouncement = async (req, res) => {
  try {
    // Find the latest active announcement
    const announcement = await AnnouncementModel.findOne({ isActive: true }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: announcement || null,
    });
  } catch (error) {
    console.error("Get Active Announcement Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching active announcement",
      error: error.message,
    });
  }
};

// Toggle Announcement Active Status
export const toggleAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await AnnouncementModel.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    const newStatus = !announcement.isActive;

    // If setting to active, deactivate all other announcements first
    if (newStatus) {
      await AnnouncementModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    announcement.isActive = newStatus;
    await announcement.save();

    return res.status(200).json({
      success: true,
      message: `Announcement ${newStatus ? "activated" : "deactivated"} successfully`,
      data: announcement,
    });
  } catch (error) {
    console.error("Toggle Announcement Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling announcement status",
      error: error.message,
    });
  }
};

// Delete Announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await AnnouncementModel.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Delete image from Cloudinary if it exists
    if (announcement.imagePublicId) {
      await deleteFromCloudinary(announcement.imagePublicId, "image");
    }

    // Delete from Database
    await AnnouncementModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting announcement",
      error: error.message,
    });
  }
};



