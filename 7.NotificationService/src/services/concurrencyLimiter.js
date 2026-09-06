class ConcurrencyLimiter {
  constructor(limit) {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error("Concurrency limit must be a positive integer");
    }

    this.limit = limit;
    this.active = 0;
    this.waiting = [];
  }

  async acquire() {
    if (this.active < this.limit) {
      this.active += 1;
      return;
    }

    await new Promise((resolve) => {
      this.waiting.push(resolve);
    });

    this.active += 1;
  }

  release() {
    if (this.active === 0) {
      throw new Error("Cannot release an unused slot");
    }

    this.active -= 1;

    const next = this.waiting.shift();

    if (next) {
      next();
    }
  }

  stats() {
    return {
      limit: this.limit,
      active: this.active,
      waiting: this.waiting.length,
    };
  }
}

export default ConcurrencyLimiter;
