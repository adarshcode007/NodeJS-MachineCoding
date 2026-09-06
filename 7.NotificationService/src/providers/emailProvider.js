import logger from "../services/logger.js";
import { RetryableError } from "../services/errors.js";

export default {
  async send(notification) {
    logger.info("provider.email.send", {
      recipient: notification.recipient,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (notification.recipient === "retry@example.com") {
      throw new RetryableError("Email provider temporarily unavailable");
    }

    logger.info("provider.email.sent", {
      recipient: notification.recipient,
    });
  },
};
