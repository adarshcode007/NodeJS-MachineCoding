const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/plain",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; //10MB

function validateMimeType(mimeType) {
  return ALLOWED_TYPES.has(mimeType);
}

export { ALLOWED_TYPES, MAX_FILE_SIZE, validateMimeType };
