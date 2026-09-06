class IdempotencyService {
  constructor() {
    this.keys = new Map();
  }

  has(key) {
    return this.keys.has(key);
  }

  get(key) {
    return this.keys.get(key);
  }

  save(key, notificationId) {
    this.keys.set(key, notificationId);

    return notificationId;
  }

  saveIfAbsent(key, notificationId) {
    if (this.keys.has(key)) {
      return {
        saved: false,
        notificationId: this.keys.get(key),
      };
    }

    this.keys.set(key, notificationId);

    return {
      saved: true,
      notificationId,
    };
  }

  delete(key) {
    return this.keys.delete(key);
  }

  clear() {
    this.keys.clear();
  }

  stats() {
    return {
      totalKeys: this.keys.size,
    };
  }
}

const idempotencyService = new IdempotencyService();

export default idempotencyService;
