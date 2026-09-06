import logger from "../services/logger.js";

export default {
  async send(notification) {
    logger.info("provider.sms.send", {
      recipient: notification.recipient,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    logger.info("provider.sms.sent", {
      recipient: notification.recipient,
    });
  },
};
