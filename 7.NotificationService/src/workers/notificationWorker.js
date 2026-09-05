import notificationQueue from "../queue/notificationQueue.js";
import deadLetterQueue from "../queue/deadLetterQueue.js";
import notificationService from "../services/notificationService.js";
import notificationStore from "../services/notificationStore.js";
import { NotificationStatus } from "../services/notificationStatus.js";

class NotificationWorker {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.isRunning = false;
    this.activeJobs = 0;
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    for (let i = 0; i < this.concurrency; i++) {
      this.process();
    }
  }

  async process() {
    while (this.isRunning) {
      const job = notificationQueue.dequeue();

      if (!job) {
        await this.sleep(100);
        continue;
      }

      this.activeJobs++;

      try {
        await this.handle(job);
      } catch (error) {
        await this.handleFailure(job, error);
      } finally {
        this.activeJobs--;
      }
    }
  }

  async handle(job) {
    const { notification } = job;

    const attemptNumber = job.attempts + 1;

    notificationStore.update(notification.id, {
      status: NotificationStatus.PROCESSING,
    });

    const attempt = {
      attemptNumber,
      startedAt: new Date().toISOString(),
      status: "processing",
    };

    notificationStore.addAttempt(notification.id, attempt);

    console.log(
      `[WORKER] Processing ${notification.id} ` + `(attempt ${attemptNumber})`,
    );

    try {
      await notificationService.send(notification);

      attempt.status = "success";
      attempt.finishedAt = new Date().toISOString();

      notificationStore.update(notification.id, {
        status: NotificationStatus.SENT,
        sentAt: attempt.finishedAt,
      });

      console.log(`[WORKER] Sent ${notification.id}`);
    } catch (error) {
      attempt.status = "failed";
      attempt.error = error.message;
      attempt.finishedAt = new Date().toISOString();

      throw error;
    }
  }

  async handleFailure(job, error) {
    const { notification } = job;

    console.error(`Notification ${notification.id} failed:`, error.message);

    // Permanent error → don't retry.
    if (!error.retryable) {
      notificationStore.update(notification.id, {
        status: NotificationStatus.FAILED,
        lastError: error.message,
        failedAt: new Date().toISOString(),
      });

      deadLetterQueue.enqueue(job);

      console.log(`Notification ${notification.id} moved to DLQ`);

      return;
    }

    // Retryable error.
    job.attempts++;

    if (job.attempts >= job.maxAttempts) {
      notificationStore.update(notification.id, {
        status: NotificationStatus.FAILED,
        lastError: error.message,
        failedAt: new Date().toISOString(),
      });

      deadLetterQueue.enqueue(job);

      console.log(`Notification ${notification.id} exhausted retries`);

      return;
    }

    const delay = this.getRetryDelay(job.attempts);

    notificationStore.update(notification.id, {
      status: NotificationStatus.RETRYING,
      lastError: error.message,
    });

    console.log(`Retrying ${notification.id} in ${delay}ms`);

    await this.sleep(delay);

    notificationQueue.enqueue(job);
  }

  getRetryDelay(attempt) {
    return 100 * 2 ** (attempt - 1);
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async stop() {
    this.isRunning = false;

    while (this.activeJobs > 0) {
      console.log(`Waiting for ${this.activeJobs} active job(s)...`);

      await this.sleep(100);
    }

    console.log("Worker stopped");
  }
}

const notificationWorker = new NotificationWorker(3);

export default notificationWorker;
