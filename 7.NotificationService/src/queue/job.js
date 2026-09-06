export function createNotificationJob(notification) {
  return {
    notification,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date().toISOString(),
  };
}
