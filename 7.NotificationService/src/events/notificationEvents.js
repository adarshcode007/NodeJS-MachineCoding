import eventBus from "./eventBus.js";
import { EventNames } from "./eventNames.js";
import { createNotificationJob } from "../queue/job.js";
import notificationQueue from "../queue/notificationQueue.js";
import logger from "../services/logger.js";

eventBus.on(EventNames.NOTIFICATION_CREATED, (notification) => {
  const job = createNotificationJob(notification);

  notificationQueue.add(job);

  logger.info("notification.enqueued", {
    notificationId: notification.id,
    channel: notification.channel,
    queueDepth: notificationQueue.size(),
  });
});
