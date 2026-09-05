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
