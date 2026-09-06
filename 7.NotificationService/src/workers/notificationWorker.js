import notificationQueue from "../queue/notificationQueue.js";
import deadLetterQueue from "../queue/deadLetterQueue.js";
import notificationService from "../services/notificationService.js";
import eventBus from "../events/eventBus.js";
import { EventNames } from "../events/eventNames.js";
import logger from "../services/logger.js";
import { errorMessage, isRetryableError } from "../services/errors.js";

class NotificationWorker {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.isRunning = false;
    this.activeJobs = 0;
    this.processedJobs = 0;
    this.sentJobs = 0;
    this.failedJobs = 0;
    this.retriedJobs = 0;
    this.pendingRetryTimers = new Set();
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    logger.info("worker.started", {
      concurrency: this.concurrency,
    });

    for (let i = 0; i < this.concurrency; i += 1) {
      this.process();
    }
  }

  async process() {
    while (this.isRunning) {
      const job = notificationQueue.remove();

      if (!job) {
        await this.sleep(50);
        continue;
      }

      this.activeJobs += 1;

      try {
        await this.handle(job);
      } catch (error) {
        await this.handleFailure(job, error);
      } finally {
        this.activeJobs -= 1;
        this.processedJobs += 1;
      }
    }
  }

  async handle(job) {
    const { notification } = job;
    const attemptNumber = job.attempts + 1;
    const startedAt = new Date().toISOString();

    eventBus.emit(EventNames.NOTIFICATION_PROCESSING, {
      notificationId: notification.id,
      attempt: {
        attemptNumber,
        startedAt,
        status: "processing",
      },
    });

    try {
      await notificationService.send(notification);

      eventBus.emit(EventNames.NOTIFICATION_SENT, {
        notificationId: notification.id,
        attemptNumber,
        sentAt: new Date().toISOString(),
      });

      this.sentJobs += 1;
    } catch (error) {
      eventBus.emit(EventNames.NOTIFICATION_ATTEMPT_FAILED, {
        notificationId: notification.id,
        attemptNumber,
        error: errorMessage(error),
        finishedAt: new Date().toISOString(),
        retryable: isRetryableError(error),
      });

      throw error;
    }
  }

  async handleFailure(job, error) {
    const { notification } = job;

    job.attempts += 1;

    const attemptNumber = job.attempts;
    const failedAt = new Date().toISOString();
    const retryable = isRetryableError(error);

    if (!retryable || job.attempts >= job.maxAttempts) {
      this.moveToDeadLetterQueue(job, error, attemptNumber, failedAt);
      return;
    }

    const delay = this.getRetryDelay(job.attempts);
    const nextRetryAt = new Date(Date.now() + delay).toISOString();

    eventBus.emit(EventNames.NOTIFICATION_RETRYING, {
      notificationId: notification.id,
      attemptNumber,
      error: errorMessage(error),
      retryDelayMs: delay,
      nextRetryAt,
    });

    this.scheduleRetry(job, delay);
    this.retriedJobs += 1;

    logger.warn("worker.retry_scheduled", {
      notificationId: notification.id,
      attemptNumber,
      retryDelayMs: delay,
      nextRetryAt,
      error: errorMessage(error),
    });
  }

  scheduleRetry(job, delay) {
    const timer = setTimeout(() => {
      this.pendingRetryTimers.delete(timer);

      if (!this.isRunning) {
        return;
      }

      notificationQueue.add(job);
    }, delay);

    if (typeof timer.unref === "function") {
      timer.unref();
    }

    this.pendingRetryTimers.add(timer);
  }

  moveToDeadLetterQueue(job, error, attemptNumber, failedAt) {
    const { notification } = job;
    const message = errorMessage(error);

    deadLetterQueue.enqueue({
      ...job,
      error: message,
      failedAt,
    });

    eventBus.emit(EventNames.NOTIFICATION_FAILED, {
      notificationId: notification.id,
      attemptNumber,
      error: message,
      failedAt,
    });

    this.failedJobs += 1;

    logger.error("worker.dead_lettered", {
      notificationId: notification.id,
      attemptNumber,
      error: message,
    });
  }

  getRetryDelay(attempt) {
    const baseDelay = 100 * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 50);

    return baseDelay + jitter;
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    for (const timer of this.pendingRetryTimers) {
      clearTimeout(timer);
    }

    this.pendingRetryTimers.clear();

    while (this.activeJobs > 0) {
      await this.sleep(50);
    }

    logger.info("worker.stopped");
  }

  stats() {
    return {
      isRunning: this.isRunning,
      concurrency: this.concurrency,
      activeJobs: this.activeJobs,
      processedJobs: this.processedJobs,
      sentJobs: this.sentJobs,
      failedJobs: this.failedJobs,
      retriedJobs: this.retriedJobs,
      pendingRetries: this.pendingRetryTimers.size,
    };
  }
}

const notificationWorker = new NotificationWorker(3);

export default notificationWorker;
