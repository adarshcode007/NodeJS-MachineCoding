import deadLetterQueue from "../queue/deadLetterQueue.js";
import notificationQueue from "../queue/notificationQueue.js";
import notificationStore from "../services/notificationStore.js";
import idempotencyService from "../services/idempotencyService.js";
import notificationService from "../services/notificationService.js";
import notificationWorker from "../workers/notificationWorker.js";
import metrics from "../services/metrics.js";

export function getHealth(req, res) {
  return sendJson(res, 200, {
    status: notificationWorker.isRunning ? "ok" : "not_running",
    service: "notification-service",
    uptimeSeconds: Number(process.uptime().toFixed(3)),
    queue: notificationQueue.stats(),
    deadLetterQueue: deadLetterQueue.stats(),
    worker: notificationWorker.stats(),
    store: notificationStore.stats(),
    idempotency: idempotencyService.stats(),
    providers: notificationService.getProviderStats(),
  });
}

export function getMetrics(req, res) {
  return sendJson(
    res,
    200,
    metrics.snapshot({
      queue: notificationQueue.stats(),
      deadLetterQueue: deadLetterQueue.stats(),
      worker: notificationWorker.stats(),
      store: notificationStore.stats(),
      idempotency: idempotencyService.stats(),
      providers: notificationService.getProviderStats(),
    }),
  );
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data));
}
