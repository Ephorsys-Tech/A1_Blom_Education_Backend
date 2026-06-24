import multer from "multer";

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "video/mp4",
    "video/mkv",
    "video/webm",
    "video/avi",
    "video/quicktime", // .mov
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept
  } else {
    cb(new Error("Only video files are allowed!"), false); // Reject
  }
};

const videoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB limit
});

export default videoUpload;
