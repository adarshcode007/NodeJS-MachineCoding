import "./events/notificationEvents.js";
import "./events/queueEvents.js";
import "./events/notificationLifecycle.js";

import { handleNotificationRoutes } from "./routes/notificationRoutes.js";
import notificationWorker from "./workers/notificationWorker.js";

export async function requestListener(req, res) {
  return handleNotificationRoutes(req, res);
}

export { notificationWorker };
