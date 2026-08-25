import redisClient from "../config/redis.js";
import { rateLimiterScript } from "../scripts/rateLimiter.script.js";

export const rateLimiter = ({ windowSize, maxRequests }) => {
  return async (req, res, next) => {
    try {
      const clientId = req.ip;
      const key = `rate-limit:${clientId}`;

      /*
      const currentCount = await redisClient.incr(key);

      if (currentCount === 1) {
        await redisClient.expire(key, windowSize);
      }
      const ttl = await redisClient.ttl(key);
      */

      const result = await redisClient.sendCommand([
        "EVAL",
        rateLimiterScript,
        "1",
        key,
        String(windowSize),
      ]);

      const currentCount = Number(result[0]);
      const ttl = Number(result[1]);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - currentCount),
      );

      if (currentCount > maxRequests) {
        res.setHeader("Retry-after", ttl);

        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later",
        });
      }

      next();
    } catch (error) {
      console.error("Rate limiter Redis error: ", {
        error: error.message,
        ip: req.ip,
        path: req.originalUrl,
      });

      // Fail-open:
      // If Redis is unavailable, allow the request.
      next();
    }
  };
};
