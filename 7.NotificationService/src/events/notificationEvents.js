import { createNotificationJob } from "../queue/job.js";
import notificationQueue from "../queue/notificationQueue.js";
import eventBus from "./eventBus.js";

eventBus.on("notification.created", (notification) => {
  const job = createNotificationJob(notification);
  notificationQueue.enqueue(job);

  console.log(`Notification: ${notification.id} added to queue`);
});
