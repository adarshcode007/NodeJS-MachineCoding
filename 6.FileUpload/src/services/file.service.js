import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MAX_FILE_SIZE, validateMimeType } from "../utils/file-validator.js";
import AppError from "../utils/AppError.js";

const uploadDir = path.join(process.cwd(), "uploads");

export function saveFile(fileStream, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    if (!validateMimeType(mimeType)) {
      fileStream.resume();

      return reject(new AppError("Unsupported file type", 400));
    }

    const extension = path.extname(originalName);

    const filename = `${crypto.randomUUID()}${extension}`;

    const filePath = path.join(uploadDir, filename);

    const writeStream = fs.createWriteStream(filePath);

    let totalBytes = 0;
    let rejected = false;

    fileStream.on("data", (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > MAX_FILE_SIZE && !rejected) {
        rejected = true;

        fileStream.destroy();
        writeStream.destroy();

        fs.unlink(filePath, () => {});

        reject(new AppError("File size exceeds 10 MB", 413));
      }
    });

    fileStream.on("error", (error) => {
      if (!rejected) {
        reject(error);
      }
    });

    fileStream.pipe(writeStream);

    writeStream.on("finish", () => {
      resolve({
        filename,
        originalName,
        path: filePath,
      });
    });

    writeStream.on("error", (error) => {
      if (!rejected) {
        reject(error);
      }
    });

    writeStream.on("finish", () => {
      if (rejected) return;

      resolve({
        filename,
        originalName,
        mimeType,
        size: totalBytes,
        path: filePath,
      });
    });

    fileStream.pipe(writeStream);
  });
}
