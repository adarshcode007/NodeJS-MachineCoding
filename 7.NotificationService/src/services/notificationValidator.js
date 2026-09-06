import notificationService from "./notificationService.js";

const SUPPORTED_CHANNELS = new Set(notificationService.getSupportedChannels());

export function validateNotificationInput(input) {
  if (!input || typeof input !== "object") {
    return "Request body must be an object";
  }

  const { idempotencyKey, userId, channel, recipient, message } = input;

  if (typeof idempotencyKey !== "string" || idempotencyKey.trim() === "") {
    return "idempotencyKey is required";
  }

  if (typeof userId !== "string" || userId.trim() === "") {
    return "userId is required";
  }

  if (typeof channel !== "string" || !SUPPORTED_CHANNELS.has(channel)) {
    return "channel must be email, sms, or push";
  }

  if (typeof recipient !== "string" || recipient.trim() === "") {
    return "recipient is required";
  }

  if (typeof message !== "string" || message.trim() === "") {
    return "message is required";
  }

  return null;
}
