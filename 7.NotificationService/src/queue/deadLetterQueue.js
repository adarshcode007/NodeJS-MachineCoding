class DeadLetterQueue {
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

const deadLetterQueue = new DeadLetterQueue();

export default deadLetterQueue;
