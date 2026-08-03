import multer from "multer";

/**
 * Wraps a multer middleware so rejected uploads (wrong file type, oversized
 * file) answer with a 400 explaining what went wrong, instead of falling
 * through to the global handler as a generic 500.
 */
export const handleUpload = (uploadMiddleware) => (req, res, next) =>
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    let message = err.message || "File upload failed";

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        message = "File too large — maximum size is 10 MB";
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        message = `Unexpected file field "${err.field}"`;
      }
    }

    return res.status(400).json({ success: false, message });
  });
