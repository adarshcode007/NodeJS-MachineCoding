import express from "express";
import { testController } from "../controllers/test.controller.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get(
  "/",
  rateLimiter({ windowSize: 60, maxRequests: 5 }),
  testController,
);

export default router;
