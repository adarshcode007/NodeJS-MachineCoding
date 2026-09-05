import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import crypto from "crypto";
import { validateMimeType } from "../utils/file-validator.js";
import AppError from "../utils/AppError.js";
import {
  countFiles,
  createFile,
  deleteFileById,
  deleteFilesByIds,
  findFileById,
  findFileByIdAndUserId,
  findFiles,
} from "../repositories/file.repository.js";
import { UPLOAD_CONFIG } from "../config/upload.js";

const uploadDir = UPLOAD_CONFIG.uploadDirectory;

// fs.mkdirSync(uploadDir, {
//   rescursive: true,
// });

export function saveFile(fileStream, originalName, mimeType, userId) {
  return new Promise((resolve, reject) => {
    if (!validateMimeType(mimeType)) {
      fileStream.resume();

      return reject(new AppError("Unsupported file type", 400));
    }

    if (!originalName) {
      fileStream.resume();
      return reject(new AppError("Filename is required", 400));
    }

    const extension = getSafeExtension(originalName);

    // const storedName = `${crypto.randomUUID()}${extension}`;

    const filename = `${crypto.randomUUID()}${extension}`;

    const filePath = path.join(uploadDir, filename);

    const writeStream = fs.createWriteStream(filePath);

    let totalBytes = 0;
    let rejected = false;

    fileStream.on("data", (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > UPLOAD_CONFIG.maxFileSize && !rejected) {
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

    writeStream.on("error", (error) => {
      if (!rejected) {
        reject(error);
      }
    });

    writeStream.on("finish", async () => {
      if (rejected) {
        return;
      }

      try {
        const fileRecord = await createFile({
          id: crypto.randomUUID(),
          originalName,
          storedName: filename,
          mimeType,
          size: totalBytes,
          path: filePath,
          userId,
        });

        resolve(fileRecord);
      } catch (error) {
        fs.unlink(filePath, () => {});
        reject(error);
      }
    });

    // fileStream.pipe(writeStream);
  });
}

function getSafeExtension(originalName) {
  const extension = path.extname(originalName);

  if (!extension) {
    return "";
  }

  return extension.toLowerCase().replace(/[^a-z0-9.]/g, "");
}

export async function getFileById(id, userId) {
  const file = await findFileByIdAndUserId(id, userId);

  if (!file) {
    throw new AppError("File not found", 404);
  }

  return file;
}

async function deletePhysicalFile(filePath) {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function deleteFile(id, userId) {
  const file = await findFileByIdAndUserId(id, userId);

  if (!file) {
    throw new AppError("File not found", 404);
  }

  await deletePhysicalFile(file.path);

  await deleteFileById(id);

  return file;
}

export async function cleanupFile(filePath) {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function cleanupUploadedFiles(files) {
  if (files.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    files.map((file) => cleanupFile(file.path)),
  );

  const successfullyDeletedIds = [];
  const failedIds = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfullyDeletedIds.push(files[index].id);
    } else {
      failedIds(files[index].id);
    }
  });

  if (successfullyDeletedIds.length > 0) {
    await deleteFilesByIds(successfullyDeletedIds);
  }
}

export async function listFiles(page = 1, limit = 20) {
  page = Number(page);
  limit = Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Page must be a positive integer", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Limit must be between 1 and 100", 400);
  }

  const offset = (page - 1) * limit;

  const [files, total] = await Promise.all([
    findFiles({ limit, offset }),
    countFiles(),
  ]);

  return {
    files,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
