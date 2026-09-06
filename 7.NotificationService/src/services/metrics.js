const DEFAULT_COUNTERS = Object.freeze({
  "notifications.created": 0,
  "notifications.duplicate": 0,
  "notifications.sent": 0,
  "notifications.failed": 0,
  "notifications.retried": 0,
  "attempts.started": 0,
  "attempts.failed": 0,
  "attempts.succeeded": 0,
  "queue.added": 0,
});

class Metrics {
  constructor() {
    this.counters = { ...DEFAULT_COUNTERS };
  }

  increment(name, amount = 1) {
    if (!Number.isFinite(amount)) {
      throw new Error("Metric increment amount must be a finite number");
    }

    if (!(name in this.counters)) {
      this.counters[name] = 0;
    }

    this.counters[name] += amount;

    return this.counters[name];
  }

  set(name, value) {
    this.counters[name] = value;

    return this.counters[name];
  }

  get(name) {
    return this.counters[name] ?? 0;
  }

  snapshot(runtime = {}) {
    return {
      generatedAt: new Date().toISOString(),
      counters: { ...this.counters },
      gauges: {
        "queue.depth": runtime.queue?.waiting ?? 0,
        "worker.active": runtime.worker?.activeJobs ?? 0,
      },
      runtime,
    };
  }

  reset() {
    this.counters = { ...DEFAULT_COUNTERS };
  }
}

const metrics = new Metrics();

export default metrics;
