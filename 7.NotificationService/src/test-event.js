import eventBus from "./events/eventBus.js";
import "./events/notificationEvents.js";
import notificationWorker from "./workers/notificationWorker.js";
import idempotencyService from "./services/idempotencyService.js";

notificationWorker.start();

function createNotification(notification) {
  const existingId = idempotencyService.get(notification.idempotencyKey);

  if (existingId) {
    console.log(`Duplicate notification. Existing ID: ${existingId}`);

    return;
  }

  idempotencyService.save(notification.idempotencyKey, notification.id);

  eventBus.emit("notification.created", notification);
}

const notification = {
  id: "notification-1",
  idempotencyKey: "order-123-shipped",
  userId: "user-123",
  channel: "email",
  recipient: "adarsh@example.com",
  message: "Your order has been shipped",
};

createNotification(notification);
createNotification(notification);
