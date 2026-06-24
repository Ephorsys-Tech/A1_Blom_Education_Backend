// upload.middleware.js

import multer from "multer";

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // ✅ Accept
  } else {
    cb(new Error("Only PDF and image files are allowed!"), false); // ❌ Reject
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 5MB limit
});

export default upload;
