import emailProvider from "../providers/emailProvider.js";
import smsProvider from "../providers/smsProvider.js";
import pushProvider from "../providers/pushProvider.js";
import { NonRetryableError } from "./errors.js";

const providers = {
  email: emailProvider,
  sms: smsProvider,
  push: pushProvider,
};

class NotificationService {
  async send(notification) {
    const provider = providers[notification.channel];

    if (!provider) {
      throw new NonRetryableError(
        `Unsupported notification channel: ${notification.channel}`,
      );
    }

    await provider.send(notification);
  }
}

const notificationService = new NotificationService();

export default notificationService;
