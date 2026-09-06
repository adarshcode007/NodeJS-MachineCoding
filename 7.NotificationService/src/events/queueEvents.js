import notificationQueue from "../queue/notificationQueue.js";
import logger from "../services/logger.js";
import metrics from "../services/metrics.js";

notificationQueue.on("job.added", (job) => {
  metrics.increment("queue.added");

  logger.debug("queue.job.added", {
    notificationId: job.notification.id,
    queueDepth: notificationQueue.size(),
  });
});
