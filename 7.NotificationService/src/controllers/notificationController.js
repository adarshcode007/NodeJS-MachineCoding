import { randomUUID } from "node:crypto";
import idempotencyService from "../services/idempotencyService.js";
import notificationStore from "../services/notificationStore.js";
import eventBus from "../events/eventBus.js";
import { NotificationStatus } from "../services/notificationStatus.js";
import { validateNotificationInput } from "../services/notificationValidator.js";

export async function createNotification(req, res) {
  let body;

  try {
    body = await parseJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, {
      error: error.message,
    });
  }

  const validationError = validateNotificationInput(body);

  if (validationError) {
    return sendJson(res, 400, {
      error: validationError,
    });
  }

  const { idempotencyKey, userId, channel, recipient, message } = body;

  if (!idempotencyKey || !userId || !channel || !recipient || !message) {
    return sendJson(res, 400, {
      error: "Missing required fields",
    });
  }

  const existingId = idempotencyService.get(idempotencyKey);

  if (existingId) {
    const existingNotification = notificationStore.getById(existingId);

    return sendJson(res, 200, {
      notification: existingNotification,
      duplicate: true,
    });
  }

  const notification = {
    id: randomUUID(),
    idempotencyKey,
    userId,
    channel,
    recipient,
    message,
    status: NotificationStatus.QUEUED,
    attempts: [],
    createdAt: new Date().toISOString(),
  };

  idempotencyService.save(idempotencyKey, notification.id);

  notificationStore.create(notification);

  eventBus.emit("notification.created", notification);

  return sendJson(res, 202, {
    notification,
    duplicate: false,
  });
}

export async function getNotification(req, res, id) {
  const notification = notificationStore.getById(id);

  if (!notification) {
    return sendJson(res, 404, {
      error: "Notification not found",
    });
  }

  return sendJson(res, 200, {
    notification,
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    const MAX_BODY_SIZE = 100 * 1024;

    req.on("data", (chunk) => {
      size += chunk.length;

      if (size > MAX_BODY_SIZE) {
        reject(new Error("Request body too large"));

        req.destroy();

        return;
      }

      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data));
}
