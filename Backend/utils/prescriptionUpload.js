import multer from "multer";

/**
 * Multer instance for prescription uploads.
 * Accepts: images (jpg/png/webp) AND PDF
 * Limit: 10 MB
 * (The default utils/multer.js only allows images — this one also allows PDF)
 */
const prescriptionFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only images (jpg/png/webp) or PDF are allowed for prescription"), false);
  }
  cb(null, true);
};

export const prescriptionUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: prescriptionFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});
