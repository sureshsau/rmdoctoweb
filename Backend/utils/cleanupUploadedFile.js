import fs from "fs";

export const cleanupUploadedFile = (req) => {
  if (req.file?.path) {
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to cleanup uploaded file:", err.message);
      }
    });
  }
};
