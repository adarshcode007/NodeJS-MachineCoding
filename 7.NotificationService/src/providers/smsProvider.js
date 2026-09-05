export default {
  async send(notification) {
    console.log(
      `[SMS] Sending to ${notification.recipient}: ${notification.message}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log(`[SMS] Sent to ${notification.recipient}`);
  },
};
