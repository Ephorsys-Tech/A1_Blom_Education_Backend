import multer from "multer";

// Configure storage to keep files in memory as buffers
const storage = multer.memoryStorage();

// File filter (optional) to allow only specific file formats if needed
const fileFilter = (req, file, cb) => {
  // Let the controller handle detailed validation if needed, or allow standard images/videos/documents here
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter,
});

export default upload;
