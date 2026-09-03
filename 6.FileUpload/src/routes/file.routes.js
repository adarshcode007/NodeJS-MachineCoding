import express from "express";
import {
  downloadFile,
  getFile,
  listFilesController,
  removeFile,
  uploadFile,
  uploadMultipleFiles,
} from "../controllers/file.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, listFilesController);

router.post("/upload", authenticate, uploadFile);

router.post("/upload-multiple", authenticate, uploadMultipleFiles);

router.get("/:id", authenticate, getFile);

router.get("/:id/download", authenticate, downloadFile);

router.delete("/:id", authenticate, removeFile);

export default router;
