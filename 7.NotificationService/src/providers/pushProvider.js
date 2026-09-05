export default {
  async send(notification) {
    console.log(
      `[PUSH] Sending to ${notification.recipient}: ${notification.message}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log(`[PUSH] Sent to ${notification.recipient}`);
  },
};
