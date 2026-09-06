import eventBus from "./eventBus.js";
import { EventNames } from "./eventNames.js";
import notificationStore from "../services/notificationStore.js";
import { NotificationStatus } from "../services/notificationStatus.js";
import { AttemptStatus } from "../services/attemptStatus.js";
import logger from "../services/logger.js";
import metrics from "../services/metrics.js";

eventBus.on(EventNames.NOTIFICATION_PROCESSING, ({ notificationId, attempt }) => {
  notificationStore.update(notificationId, {
    status: NotificationStatus.PROCESSING,
    retryDelayMs: null,
    nextRetryAt: null,
  });

  notificationStore.addAttempt(notificationId, {
    ...attempt,
    status: AttemptStatus.PROCESSING,
  });

  metrics.increment("attempts.started");

  logger.debug("notification.processing", {
    notificationId,
    attemptNumber: attempt.attemptNumber,
  });
});

eventBus.on(
  EventNames.NOTIFICATION_ATTEMPT_FAILED,
  ({ notificationId, attemptNumber, error, finishedAt, retryable }) => {
    notificationStore.updateAttempt(notificationId, attemptNumber, {
      status: AttemptStatus.FAILED,
      finishedAt,
      error,
      retryable: Boolean(retryable),
    });

    metrics.increment("attempts.failed");
  },
);

eventBus.on(EventNames.NOTIFICATION_SENT, ({ notificationId, attemptNumber, sentAt }) => {
  notificationStore.update(notificationId, {
    status: NotificationStatus.SENT,
    sentAt,
    lastError: null,
    retryDelayMs: null,
    nextRetryAt: null,
  });

  notificationStore.updateAttempt(notificationId, attemptNumber, {
    status: AttemptStatus.SUCCESS,
    finishedAt: sentAt,
    sentAt,
    error: null,
  });

  metrics.increment("notifications.sent");
  metrics.increment("attempts.succeeded");

  logger.info("notification.sent", {
    notificationId,
    attemptNumber,
  });
});

eventBus.on(
  EventNames.NOTIFICATION_RETRYING,
  ({ notificationId, attemptNumber, error, retryDelayMs, nextRetryAt }) => {
    notificationStore.update(notificationId, {
      status: NotificationStatus.RETRYING,
      lastError: error,
      retryDelayMs,
      nextRetryAt,
    });

    metrics.increment("notifications.retried");

    logger.warn("notification.retrying", {
      notificationId,
      attemptNumber,
      retryDelayMs,
      nextRetryAt,
      error,
    });
  },
);

eventBus.on(
  EventNames.NOTIFICATION_FAILED,
  ({ notificationId, attemptNumber, error, failedAt }) => {
    notificationStore.update(notificationId, {
      status: NotificationStatus.FAILED,
      lastError: error,
      failedAt,
      retryDelayMs: null,
      nextRetryAt: null,
    });

    if (attemptNumber) {
      notificationStore.updateAttempt(notificationId, attemptNumber, {
        status: AttemptStatus.FAILED,
        finishedAt: failedAt,
        error,
      });
    }

    metrics.increment("notifications.failed");

    logger.error("notification.failed", {
      notificationId,
      attemptNumber,
      error,
    });
  },
);
