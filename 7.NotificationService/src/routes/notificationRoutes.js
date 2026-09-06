import {
  createNotification,
  getNotification,
} from "../controllers/notificationController.js";
import { getHealth, getMetrics } from "../controllers/systemController.js";

export async function handleNotificationRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/health") {
    return getHealth(req, res);
  }

  if (req.method === "GET" && pathname === "/metrics") {
    return getMetrics(req, res);
  }

  if (req.method === "POST" && pathname === "/notifications") {
    try {
      await createNotification(req, res);
    } catch (error) {
      return sendError(res, 500, error.message);
    }

    return;
  }

  if (req.method === "GET" && pathname.startsWith("/notifications/")) {
    const id = pathname.split("/")[2];

    return getNotification(req, res, id);
  }

  sendError(res, 404, "Route not found");
}

function sendError(res, statusCode, message) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(
    JSON.stringify({
      error: message,
    }),
  );
}
