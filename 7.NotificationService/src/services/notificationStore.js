class NotificationStore {
  constructor() {
    this.notifications = new Map();
  }

  create(notification) {
    this.notifications.set(notification.id, notification);

    return notification;
  }

  getById(id) {
    return this.notifications.get(id) || null;
  }

  update(id, updates) {
    const notification = this.notifications.get(id);

    if (!notification) {
      return null;
    }

    Object.assign(notification, updates);

    return notification;
  }

  addAttempt(id, attempt) {
    const notification = this.notifications.get(id);

    if (!notification) {
      return null;
    }

    const existing = notification.attempts.find(
      (item) => item.attemptNumber === attempt.attemptNumber,
    );

    if (existing) {
      Object.assign(existing, attempt);

      return existing;
    }

    notification.attempts.push(attempt);

    return attempt;
  }

  updateAttempt(id, attemptNumber, updates) {
    const notification = this.notifications.get(id);

    if (!notification) {
      return null;
    }

    const attempt = notification.attempts.find(
      (item) => item.attemptNumber === attemptNumber,
    );

    if (!attempt) {
      return null;
    }

    Object.assign(attempt, updates);

    return attempt;
  }

  delete(id) {
    return this.notifications.delete(id);
  }

  clear() {
    this.notifications.clear();
  }

  stats() {
    return {
      totalNotifications: this.notifications.size,
    };
  }
}

const notificationStore = new NotificationStore();

export default notificationStore;
