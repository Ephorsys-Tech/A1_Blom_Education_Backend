import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Configure storage to keep files in memory as buffers
const storage = multer.memoryStorage();

// File filter (optional) to allow only specific file formats if needed
const fileFilter = (req, file, cb) => {
  // Let the controller handle detailed validation if needed, or allow standard images/videos/documents here
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter,
});

// Configure disk storage for heavy video files that need processing/chunking
const videoDiskStoragePath = path.resolve("videos");
if (!fs.existsSync(videoDiskStoragePath)) {
  fs.mkdirSync(videoDiskStoragePath, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDiskStoragePath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

export const uploadVideoDisk = multer({
  storage: diskStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

export default upload;

