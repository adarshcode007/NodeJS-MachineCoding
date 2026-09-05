import { RetryableError } from "../services/errors.js";

export default {
  async send(notification) {
    console.log(`[EMAIL] Sending to ${notification.recipient}`);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Temporary provider failure.
    if (notification.recipient === "retry@example.com") {
      throw new RetryableError("Email provider temporarily unavailable");
    }

    console.log(`[EMAIL] Sent to ${notification.recipient}`);
  },
};
