import path from "path";

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5,

  allowedMimeTypes: new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
    "text/plain",
  ]),

  uploadDirectory: path.join(process.cwd(), "uploads"),
};
