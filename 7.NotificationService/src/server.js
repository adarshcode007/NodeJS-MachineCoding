import http from "node:http";

import { handleNotificationRoutes } from "./routes/notificationRoutes.js";
import notificationWorker from "./workers/notificationWorker.js";
import "./events/notificationEvents.js";

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  await handleNotificationRoutes(req, res);
});

notificationWorker.start();

server.listen(PORT, () => {
  console.log(`Notification service on port ${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    console.log("HTTP server stopped accepting connections");

    await notificationWorker.stop();

    console.log("Shutdown complete");

    process.exit(0);
  });
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});
