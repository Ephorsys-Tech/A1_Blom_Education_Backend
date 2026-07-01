import asyncHandler from "../middleware/asyncHandler.js";

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  return res.status(200).json({
    success: true,
    file: {
      url: req.file.location,
      key: req.file.key,
      type: req.file.mimetype,
      size: req.file.size,
    },
  });
});
