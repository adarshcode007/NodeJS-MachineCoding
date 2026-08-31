import express from "express";
import Busboy from "busboy";

const router = express.Router();

router.post("/upload", (req, res, next) => {
  const contentType = req.headers["content-type"];

  if (!contentType || !contentType.startsWith("multipart/form-data")) {
    return res.status(400).json({
      success: false,
      message: "Content-Type must be multipart/form-data",
    });
  }

  const busboy = Busboy({
    headers: req.headers,
  });

  let uploadPromise = null;

  busboy.on("file", (fieldname, fileStream, info) => {
    const { filename, mimeType } = info;

    if (fieldname !== "file") {
      fileStream.resume();
      return;
    }

    uploadPromise = saveFile(fileStream, filename, mimeType);
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

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        file,
      });
    } catch (error) {
      next(error);
    }
  });

  busboy.on("error", (error) => {
    next(error);
  });

  req.pipe(busboy);
});

export default router;
