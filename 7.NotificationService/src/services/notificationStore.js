class NotificationStore {
  constructor() {
    this.notifications = new Map();
  }

  create(notification) {
    this.notifications.set(notification.id, notification);

    return notification;
  }

  getById(id) {
    return this.notifications.get(id);
  }

  update(id, updates) {
    const notification = this.notifications.get(id);

    if (!notification) return null;

    Object.assign(notification, updates);

    return notification;
  }

  addAttempt(id, attempt) {
    const notification = this.notifications.get(id);

    if (!notification) {
      return null;
    }

    notification.attempts.push(attempt);

    return attempt;
  }
}

const notificationStore = new NotificationStore();

export default notificationStore;
