export class RetryableError extends Error {
  constructor(message) {
    super(message);

    this.name = "RetryableError";
    this.retryable = true;
  }
}

export class NonRetryableError extends Error {
  constructor(message) {
    super(message);

    this.name = "NonRetryableError";
    this.retryable = false;
  }
}

export function isRetryableError(error) {
  return Boolean(error && error.retryable === true);
}

export function errorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
