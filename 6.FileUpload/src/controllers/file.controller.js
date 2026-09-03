import Busboy from "busboy";
import fs from "fs";
import {
  saveFile,
  getFileById,
  deleteFile,
  cleanupUploadedFiles,
  listFiles,
} from "../services/file.service.js";
import { UPLOAD_CONFIG } from "../config/upload.js";

export async function uploadFile(req, res, next) {
  try {
    const contentType = req.headers["content-type"];

    if (!contentType?.startsWith("multipart/form-data")) {
      return res.status(400).json({
        success: false,
        message: "Content-Type must be multipart/form-data",
      });
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: UPLOAD_CONFIG.maxFiles,
      },
    });

    let uploadPromise = null;

    busboy.on("file", (fieldname, fileStream, info) => {
      const { filename, mimeType } = info;

      if (fieldname !== "file") {
        fileStream.resume();
        return;
      }

      uploadPromise = saveFile(fileStream, filename, mimeType, req.user.id);
    });

    busboy.on("finish", async () => {
      try {
        if (!uploadPromise) {
          return res.status(400).json({
            success: false,
            message: "No file uploaded",
          });
        }

        const file = await uploadPromise;

        return res.status(201).json({
          success: true,
          message: "File uploaded successfully",
          file,
        });
      } catch (error) {
        next(error);
      }
    });

    busboy.on("error", next);

    req.pipe(busboy);
  } catch (error) {
    next(error);
  }
}

export async function getFile(req, res, next) {
  try {
    const file = await getFileById(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const file = await getFileById(req.params.id, req.user.id);

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: "File no longer exists on storage",
      });
    }

    res.setHeader("Content-Type", file.mime_type);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.original_name}"`,
    );

    res.setHeader("Content-Length", file.size);

    const readStream = fs.createReadStream(file.path);

    readStream.on("error", next);

    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function removeFile(req, res, next) {
  try {
    await deleteFile(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadMultipleFiles(req, res, next) {
  try {
    const contentType = req.headers["content-type"];

    if (!contentType?.startsWith("multipart/form-data")) {
      return res.status(400).json({
        success: false,
        message: "Content-Type must be multipart/form-data",
      });
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: UPLOAD_CONFIG.maxFiles,
      },
    });

    const uploadPromises = [];

    let limitExceeded = false;

    busboy.on("filesLimit", () => {
      limitExceeded = true;
    });

    busboy.on("file", (fieldname, fileStream, info) => {
      const { filename, mimeType } = info;

      if (!filename) {
        fileStream.resume();
        return;
      }

      if (fieldname !== "files") {
        fileStream.resume();
        return;
      }

      const uploadPromise = saveFile(
        fileStream,
        filename,
        mimeType,
        req.user.id,
      );

      uploadPromises.push(uploadPromise);
    });

    busboy.on("finish", async () => {
      try {
        if (uploadPromises.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No files uploaded",
          });
        }

        if (limitExceeded) {
          return res.status(400).json({
            success: false,
            message: "Maximum 5 files allowed",
          });
        }

        const results = await Promise.allSettled(uploadPromises);

        const successfulFiles = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);

        const failed = results.find((result) => result.status === "rejected");

        if (failed) {
          await cleanupUploadedFiles(successfulFiles);

          throw failed.reason;
        }

        return res.status(201).json({
          success: true,
          message: "Files uploaded successfully",
          files: successfulFiles,
        });
      } catch (error) {
        next(error);
      }
    });

    busboy.on("error", next);

    req.pipe(busboy);
  } catch (error) {
    next(error);
  }
}

export async function listFilesController(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await listFiles(page, limit);

    res.status(200).json({
      success: true,
      data: result.files,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
