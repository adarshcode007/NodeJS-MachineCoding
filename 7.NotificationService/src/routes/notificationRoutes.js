import {
  createNotification,
  getNotification,
} from "../controllers/notificationController.js";

export async function handleNotificationRoutes(req, res) {
  if (req.method === "POST" && req.url === "/notifications") {
    try {
      await createNotification(req, res);
    } catch (error) {
      return sendError(res, 400, error.message);
    }

    return;
  }

  if (req.method === "GET" && req.url.startsWith("/notifications/")) {
    const id = req.url.split("/")[2];

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
