import logger from "../services/logger.js";

export default {
  async send(notification) {
    logger.info("provider.push.send", {
      recipient: notification.recipient,
      message: notification.message,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    logger.info("provider.push.sent", {
      recipient: notification.recipient,
    });
  },
};
