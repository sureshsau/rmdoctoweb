import fs from "fs";

/**
 * Cleanup uploaded files when request fails
 * Works for both multer memoryStorage and diskStorage
 */
export const cleanupUploadedFile = (req) => {
  try {
    // 🔹 Multiple files (upload.array)
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        // If diskStorage is used in future
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      // Clear memory reference
      req.files.length = 0;
    }

    // 🔹 Single file (upload.single)
    if (req.file) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      req.file = null;
    }
  } catch (error) {
    // 🚨 Never crash request because of cleanup
    console.error("⚠️ cleanupUploadedFile error:", error.message);
  }
};
