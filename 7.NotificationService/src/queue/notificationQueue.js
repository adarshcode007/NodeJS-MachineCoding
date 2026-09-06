import { EventEmitter } from "node:events";

class NotificationQueue extends EventEmitter {
  constructor() {
    super();

    this.jobs = [];
    this.totalAdded = 0;
    this.totalProcessed = 0;
  }

  add(job) {
    this.jobs.push(job);
    this.totalAdded += 1;

    this.emit("job.added", job);

    return job;
  }

  dequeue() {
    const job = this.jobs.shift();

    if (job) {
      this.totalProcessed += 1;
    }

    return job;
  }

  remove() {
    return this.dequeue();
  }

  size() {
    return this.jobs.length;
  }

  isEmpty() {
    return this.jobs.length === 0;
  }

  stats() {
    return {
      waiting: this.jobs.length,
      totalAdded: this.totalAdded,
      totalProcessed: this.totalProcessed,
    };
  }

  clear() {
    this.jobs.length = 0;
    this.totalAdded = 0;
    this.totalProcessed = 0;
  }
}

const notificationQueue = new NotificationQueue();

export default notificationQueue;
