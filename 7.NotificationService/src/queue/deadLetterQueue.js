class DeadLetterQueue {
  constructor() {
    this.jobs = [];
  }

  enqueue(job) {
    this.jobs.push(job);

    return job;
  }

  dequeue() {
    return this.jobs.shift() || null;
  }

  size() {
    return this.jobs.length;
  }

  clear() {
    this.jobs.length = 0;
  }

  stats() {
    return {
      size: this.jobs.length,
    };
  }
}

const deadLetterQueue = new DeadLetterQueue();

export default deadLetterQueue;
