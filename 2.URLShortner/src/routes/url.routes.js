import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  createUrl,
  getUrl,
  getUrls,
  removeUrl,
} from "../controllers/url.controller.js";

const router = express.Router();

router.post("/", protect, createUrl);
router.get("/urls", protect, getUrls);
router.get("/:id", protect, getUrl);
router.delete("/:id", protect, removeUrl);

export default router;
