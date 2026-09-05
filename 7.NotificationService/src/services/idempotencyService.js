class IdempotencyService {
  constructor() {
    this.keys = new Map();
  }

  has(key) {
    return this.keys.has(key);
  }

  save(key, notificationId) {
    this.keys.set(key, notificationId);
  }

  get(key) {
    return this.keys.get(key);
  }
}

const idempotencyService = new IdempotencyService();

export default idempotencyService;
