import http from "node:http";

import { notificationWorker, requestListener } from "./app.js";
import logger from "./services/logger.js";

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  Promise.resolve(requestListener(req, res)).catch((error) => {
    logger.error("request.failed", error);

    if (!res.headersSent) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: "Internal server error",
        }),
      );
    }
  });
});

notificationWorker.start();

server.listen(PORT, () => {
  logger.info("server.started", {
    port: PORT,
  });
});

async function shutdown(signal) {
  logger.warn("shutdown.received", {
    signal,
  });

  server.close(async () => {
    logger.info("server.stopped_accepting_connections");

    await notificationWorker.stop();

    logger.info("shutdown.complete");
    process.exit(0);
  });
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});
