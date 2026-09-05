class NotificationQueue {
  constructor() {
    this.jobs = [];
  }
  enqueue(job) {
    this.jobs.push(job);
  }
  dequeue() {
    return this.jobs.shift();
  }
  size() {
    return this.jobs.length;
  }
}

const notificationQueue = new NotificationQueue();

export default notificationQueue;
