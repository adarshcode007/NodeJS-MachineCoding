import express from "express";
import {
  clearCache,
  deleteCache,
  getCache,
  getCacheState,
  getCacheStats,
  peekCache,
  setCache,
} from "../controllers/cache.controller.js";

const router = express.Router();

router.get("/stats", getCacheStats);
router.get("/", getCacheState);

router.delete("/", clearCache);

router.post("/:key", setCache);

router.get("/:key/peek", peekCache);
router.get("/:key", getCache);

router.delete("/:key", deleteCache);
