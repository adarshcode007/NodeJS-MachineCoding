import emailProvider from "../providers/emailProvider.js";
import smsProvider from "../providers/smsProvider.js";
import pushProvider from "../providers/pushProvider.js";
import { NonRetryableError } from "./errors.js";
import ConcurrencyLimiter from "./concurrencyLimiter.js";

const providers = {
  email: {
    provider: emailProvider,
    limiter: new ConcurrencyLimiter(2),
  },
  sms: {
    provider: smsProvider,
    limiter: new ConcurrencyLimiter(1),
  },
  push: {
    provider: pushProvider,
    limiter: new ConcurrencyLimiter(5),
  },
};

class NotificationService {
  async send(notification) {
    const config = providers[notification.channel];

    if (!config) {
      throw new NonRetryableError(
        `Unsupported notification channel: ${notification.channel}`,
      );
    }

    const { provider, limiter } = config;

    await limiter.acquire();

    try {
      await provider.send(notification);
    } finally {
      limiter.release();
    }
  }

  getProviderStats() {
    return Object.fromEntries(
      Object.entries(providers).map(([channel, config]) => [
        channel,
        config.limiter.stats(),
      ]),
    );
  }

  getSupportedChannels() {
    return Object.keys(providers);
  }
}

const notificationService = new NotificationService();

export default notificationService;
