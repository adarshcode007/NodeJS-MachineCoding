import { UPLOAD_CONFIG } from "../config/upload.js";

export function validateMimeType(mimeType) {
  return UPLOAD_CONFIG.allowedMimeTypes.has(mimeType);
}

export function validateFileSize(size) {
  return size <= UPLOAD_CONFIG.maxFileSize;
}
