# Notification Service — Node.js Machine Coding

## 1. Objective

Build a production-minded **Notification Service** in Node.js as a machine-coding exercise.

The primary concepts being demonstrated are:

- Event-driven architecture
- In-memory job queues
- Background workers
- Asynchronous notification delivery
- Multiple notification channels
- Retry mechanisms
- Exponential backoff
- Dead-letter queues
- Idempotency
- Notification lifecycle/state management
- Delivery attempt history
- Worker concurrency
- Provider-specific concurrency limits
- Graceful shutdown
- Request validation
- Observability
- Testing
- Concurrency/load testing
- Production architecture discussion

The implementation should remain understandable enough for a machine-coding interview while progressively introducing production-grade concepts.

---

# 2. Core Architecture

The intended architecture is:

```text
                         HTTP Client
                              |
                              v
                    +-------------------+
                    |   HTTP Server     |
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |    Controller     |
                    +-------------------+
                              |
                              v
                    +-------------------+
                    | Request Validation|
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |   Idempotency     |
                    +-------------------+
                              |
                              v
                    +-------------------+
                    | Notification Store|
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |    Event Bus      |
                    |  EventEmitter     |
                    +-------------------+
                              |
                              | notification.created
                              v
                    +-------------------+
                    | NotificationQueue |
                    +-------------------+
                              |
                 +------------+------------+
                 |            |            |
                 v            v            v
             Worker 1     Worker 2     Worker 3
                 |            |            |
                 +------------+------------+
                              |
                              v
                    +-------------------+
                    | Notification      |
                    | Service           |
                    +-------------------+
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
        Email Provider   SMS Provider    Push Provider
             |                |                |
             +----------------+----------------+
                              |
                              v
                    Lifecycle Events
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
           State            Audit           Metrics
```

Failure path:

```text
Provider
   |
   v
 Error
   |
   +-------------------+
   |                   |
   v                   v
Retryable          Non-retryable
   |                   |
   v                   v
Retry              Dead Letter Queue
   |
   v
Exponential Backoff
   |
   v
Queue
```

---

# 3. Current Project Structure

Current intended structure:

```text
notification-service/
├── src/
│   ├── controllers/
│   │   └── notificationController.js
│   │
│   ├── events/
│   │   ├── eventBus.js
│   │   ├── eventNames.js
│   │   ├── notificationEvents.js
│   │   └── notificationLifecycle.js
│   │
│   ├── queue/
│   │   ├── notificationQueue.js
│   │   ├── deadLetterQueue.js
│   │   └── job.js
│   │
│   ├── workers/
│   │   └── notificationWorker.js
│   │
│   ├── services/
│   │   ├── notificationService.js
│   │   ├── notificationStore.js
│   │   ├── notificationStatus.js
│   │   ├── notificationValidator.js
│   │   ├── idempotencyService.js
│   │   ├── concurrencyLimiter.js
│   │   └── errors.js
│   │
│   ├── providers/
│   │   ├── emailProvider.js
│   │   ├── smsProvider.js
│   │   └── pushProvider.js
│   │
│   ├── routes/
│   │   └── notificationRoutes.js
│   │
│   ├── app.js
│   └── server.js
│
├── test/
│
├── package.json
└── .gitignore
```

A temporary file may also exist:

```text
src/test-event.js
```

This was used during development to test the event bus and queue before the HTTP API existed. It should eventually be removed.

---

# 4. Technology Decisions

Current implementation:

- Node.js
- ES Modules
- Built-in `http` module
- Built-in `events` module / `EventEmitter`
- In-memory `Map`
- In-memory arrays
- No Express
- No external queue
- No database yet

The reason for initially avoiding Express is to demonstrate understanding of Node.js primitives.

The final machine-coding implementation can remain framework-free unless there is a strong reason to introduce Express.

---

# 5. Event Bus

File:

```text
src/events/eventBus.js
```

Current concept:

```js
import { EventEmitter } from "node:events";

const eventBus = new EventEmitter();

export default eventBus;
```

The event bus is used for application-level events.

Examples:

```text
notification.created
notification.processing
notification.sent
notification.retrying
notification.failed
```

Important distinction:

```text
EventEmitter
    =
in-process event communication
```

It is NOT a durable message broker.

If the Node.js process crashes, events that haven't been persisted elsewhere are lost.

---

# 6. Event Names

File:

```text
src/events/eventNames.js
```

Current intended structure:

```js
export const EventNames = Object.freeze({
  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_PROCESSING: "notification.processing",
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_RETRYING: "notification.retrying",
  NOTIFICATION_FAILED: "notification.failed",
});
```

The event names should not be scattered as raw strings throughout the codebase.

---

# 7. Notification Model

A notification currently looks conceptually like:

```js
{
  id: "uuid",
  idempotencyKey: "order-123-shipped",
  userId: "user-123",
  channel: "email",
  recipient: "adarsh@example.com",
  message: "Your order has been shipped",

  status: "queued",

  attempts: [],

  createdAt: "timestamp",

  sentAt: "timestamp",
  failedAt: "timestamp",
  lastError: "..."
}
```

Not every optional field exists immediately.

---

# 8. Notification Status

File:

```text
src/services/notificationStatus.js
```

Current statuses:

```js
export const NotificationStatus = Object.freeze({
  QUEUED: "queued",
  PROCESSING: "processing",
  RETRYING: "retrying",
  SENT: "sent",
  FAILED: "failed",
});
```

Lifecycle:

```text
queued
   |
   v
processing
   |
   +-------> sent
   |
   v
retrying
   |
   v
processing
   |
   v
failed
```

---

# 9. Notification Store

File:

```text
src/services/notificationStore.js
```

Currently uses:

```js
Map;
```

Conceptually:

```text
notificationId -> notification
```

Responsibilities:

```text
create()
getById()
update()
addAttempt()
updateAttempt()
```

The store abstracts persistence.

Currently:

```text
NotificationStore
       |
       v
      Map
```

Future production version:

```text
NotificationStore
       |
       v
    Postgres
```

The rest of the application should ideally not care which persistence implementation is underneath.

---

# 10. Idempotency

File:

```text
src/services/idempotencyService.js
```

Currently uses:

```js
Map;
```

Conceptually:

```text
idempotencyKey -> notificationId
```

Flow:

```text
Request
   |
   v
Check idempotency key
   |
   +---- exists ----> return existing notification
   |
   +---- doesn't exist
              |
              v
        create notification
              |
              v
        save idempotency key
              |
              v
          publish event
```

Example:

```text
Request 1
idempotencyKey = order-123

→ create notification
→ queue job
```

Request 2:

```text
idempotencyKey = order-123

→ existing notification found
→ don't create another job
```

Important production consideration:

The current:

```js
Map.has();
Map.set();
```

is not suitable for distributed deployments.

Production implementation should use an atomic operation such as:

```text
Redis SET NX
```

or:

```text
Postgres UNIQUE constraint
```

The check-and-create operation must be atomic.

---

# 11. Notification Queue

File:

```text
src/queue/notificationQueue.js
```

Current implementation uses:

```js
this.jobs = [];
```

Conceptually:

```text
NotificationQueue
├── add(job)
├── remove()
├── size()
├── isEmpty()
├── stats()
└── clear()
```

It also extends `EventEmitter`.

Queue statistics:

```js
{
  (waiting, totalAdded, totalProcessed);
}
```

Current architecture:

```text
Event Bus
    |
    v
Notification Queue
    |
    v
Worker
```

Production replacement:

```text
Notification Queue
       |
       v
Redis / BullMQ
```

or another durable broker.

---

# 12. Job Model

File:

```text
src/queue/job.js
```

A queue job conceptually looks like:

```js
{
  notification,
  attempts: 0,
  maxAttempts: 3
}
```

Important distinction:

```text
Notification
    =
business entity

Job
    =
work to be performed

Attempt
    =
one delivery execution
```

These should not be conceptually mixed together.

---

# 13. Dead Letter Queue

File:

```text
src/queue/deadLetterQueue.js
```

Currently another in-memory queue.

Purpose:

```text
Jobs that cannot successfully complete
after retry/permanent failure handling
```

Flow:

```text
Queue
  |
  v
Worker
  |
  v
Provider
  |
  v
Failure
  |
  +---- retryable ----> retry
  |
  +---- permanent ----> DLQ
  |
  +---- retries exhausted ----> DLQ
```

Production version should make the DLQ durable.

---

# 14. Notification Providers

Files:

```text
src/providers/emailProvider.js
src/providers/smsProvider.js
src/providers/pushProvider.js
```

Each provider exposes approximately:

```js
await provider.send(notification);
```

Currently providers are mocks.

Example:

```text
EmailProvider
    |
    v
console.log()
```

No actual external provider is connected.

Future production integrations could be:

```text
Email → SendGrid / SES / Resend
SMS   → Twilio
Push  → FCM / APNs
```

The service should not directly depend on these provider implementations.

---

# 15. Notification Service

File:

```text
src/services/notificationService.js
```

The service maps:

```text
channel → provider
```

Conceptually:

```js
const providers = {
  email: emailProvider,
  sms: smsProvider,
  push: pushProvider,
};
```

Then:

```js
await notificationService.send(notification);
```

The worker does NOT contain:

```js
if channel === "email"
else if channel === "sms"
else if channel === "push"
```

Instead:

```text
Worker
   |
   v
NotificationService
   |
   +--> Email
   +--> SMS
   +--> Push
```

This is effectively a provider/strategy abstraction.

---

# 16. Error Classification

File:

```text
src/services/errors.js
```

Two error categories:

```js
RetryableError;
NonRetryableError;
```

Example:

```text
Retryable:
- network timeout
- provider unavailable
- provider 503
- temporary connection failure

Non-retryable:
- unsupported channel
- invalid recipient
- malformed data
- permanent business validation error
```

The worker should not blindly retry every exception.

---

# 17. Retry Strategy

Current retry configuration:

```text
maxAttempts = 3
```

Current exponential backoff:

```text
Attempt 1 → 100ms
Attempt 2 → 200ms
Attempt 3 → 400ms
```

Formula:

```js
100 * 2 ** (attempt - 1);
```

Reason:

If a provider is temporarily down, immediate retries from thousands of jobs can make the outage worse.

Exponential backoff spreads retry traffic over time.

Future improvement:

Add **jitter**.

Example:

```text
base delay + random jitter
```

This avoids many workers retrying at exactly the same time.

---

# 18. Worker

File:

```text
src/workers/notificationWorker.js
```

The worker:

1. Gets jobs from the queue
2. Processes notifications
3. Calls NotificationService
4. Emits lifecycle events
5. Handles retryable errors
6. Sends permanently failed jobs to DLQ
7. Supports concurrency
8. Supports graceful shutdown

Current worker concurrency:

```js
new NotificationWorker(3);
```

Meaning:

```text
maximum 3 jobs in flight
```

---

# 19. Worker Concurrency

Current architecture:

```text
Queue
 |
 +--> Worker 1
 +--> Worker 2
 +--> Worker 3
```

This allows:

```text
Job A ───────>
Job B ───────>
Job C ───────>
```

to execute concurrently.

This is different from Node.js using multiple JavaScript threads.

Node's JavaScript execution remains single-threaded, but asynchronous I/O operations can be concurrently in flight.

---

# 20. Provider-Specific Concurrency

File:

```text
src/services/concurrencyLimiter.js
```

Current provider limits:

```text
Email → 2
SMS   → 1
Push  → 5
```

Architecture:

```text
NotificationService
       |
       +---- Email → limiter(2)
       |
       +---- SMS   → limiter(1)
       |
       +---- Push  → limiter(5)
```

Why?

Global worker concurrency is not enough.

Example:

```text
Worker concurrency = 10
Email provider limit = 2
```

We want 10 jobs to be processed globally while only 2 email requests are simultaneously sent.

The limiter uses:

```text
active count
waiting promises
acquire()
release()
```

Every acquired slot MUST be released in `finally`.

---

# 21. Request Validation

File:

```text
src/services/notificationValidator.js
```

Current supported channels:

```text
email
sms
push
```

Required fields:

```text
idempotencyKey
userId
channel
recipient
message
```

Validation occurs before:

```text
event
queue
worker
provider
```

This prevents invalid requests from becoming unnecessary background jobs.

---

# 22. Request Body Protection

The HTTP body parser currently limits body size to approximately:

```text
100 KB
```

This prevents a client from continuously sending a huge request body and forcing the service to accumulate unbounded data in memory.

---

# 23. HTTP API

Current intended endpoints:

```text
POST /notifications
GET  /notifications/:id
```

## POST /notifications

Example request:

```json
{
  "idempotencyKey": "order-123-shipped",
  "userId": "user-123",
  "channel": "email",
  "recipient": "user@example.com",
  "message": "Your order has been shipped"
}
```

Successful response:

```text
202 Accepted
```

Reason:

The notification has been accepted for asynchronous processing but is not necessarily delivered yet.

Conceptually:

```text
POST
 |
 v
queued
 |
 v
202 Accepted
 |
 v
background processing
 |
 v
sent
```

---

# 24. GET /notifications/:id

Used to inspect notification state.

Example:

```json
{
  "notification": {
    "id": "...",
    "status": "sent",
    "attempts": [
      {
        "attemptNumber": 1,
        "status": "failed",
        "error": "Provider timeout"
      },
      {
        "attemptNumber": 2,
        "status": "success"
      }
    ]
  }
}
```

This provides a basic delivery audit trail.

---

# 25. Attempt History

Each notification can have multiple delivery attempts.

Conceptually:

```text
Notification
    |
    +---- Attempt 1 → failed
    |
    +---- Attempt 2 → failed
    |
    +---- Attempt 3 → success
```

An attempt contains approximately:

```js
{
  (attemptNumber, startedAt, finishedAt, status, error);
}
```

This is useful for debugging and operational visibility.

---

# 26. Lifecycle Events

Current intended lifecycle events:

```text
notification.created
notification.processing
notification.sent
notification.retrying
notification.failed
```

The idea is:

```text
Worker
  |
  | executes job
  |
  +---- processing event
  |
  +---- sent event
  |
  +---- retrying event
  |
  +---- failed event
```

Listeners can then perform side effects.

For example:

```text
notification.sent
       |
       +--> update state
       +--> audit
       +--> metrics
       +--> logging
```

Important design principle:

Do NOT use events for every possible function call.

Use direct calls for tightly coupled operations.

Use events when multiple independent components may react to something that happened.

---

# 27. Graceful Shutdown

The server handles:

```text
SIGTERM
SIGINT
```

Shutdown flow:

```text
SIGTERM
   |
   v
Stop accepting new HTTP connections
   |
   v
Stop workers from taking new jobs
   |
   v
Wait for active jobs
   |
   v
Exit process
```

Worker tracks:

```js
activeJobs;
```

and waits until:

```text
activeJobs === 0
```

before exiting.

This avoids terminating an active provider request unnecessarily.

---

# 28. Current Known Limitations

The current implementation is intentionally in-memory.

Major limitations:

## Queue durability

```text
Array
```

means jobs disappear if the process crashes.

## Notification persistence

```text
Map
```

means all notification state disappears on restart.

## Idempotency persistence

```text
Map
```

means duplicate protection disappears on restart.

## Distributed deployment

Multiple Node.js instances would have independent:

```text
queues
stores
idempotency maps
```

which is not correct for a real distributed service.

## Retry scheduling

Current implementation sleeps inside the worker during retry backoff.

This means a worker can be occupied waiting for a retry delay.

A production queue should support delayed jobs directly.

## DLQ

Currently in memory.

Should be durable in production.

## Validation

Currently basic custom validation.

Could use a schema validation library in a larger application.

---

# 29. Planned End State

The goal is NOT to blindly add complexity.

The final machine-coding implementation should be:

```text
simple enough to explain
+
robust enough to demonstrate backend knowledge
```

The planned end state should contain:

## Core

- HTTP API
- Notification creation
- Notification lookup
- Event bus
- Queue
- Worker pool
- Multiple providers

## Reliability

- Retry
- Exponential backoff
- Jitter
- Retryable/non-retryable errors
- DLQ
- Idempotency
- Graceful shutdown

## Concurrency

- Global worker concurrency
- Provider-specific concurrency limits
- Correct resource release

## Observability

- Structured logging
- Queue metrics
- Processing metrics
- Success/failure/retry counters
- Active jobs
- Queue depth
- Basic health endpoint
- Basic metrics endpoint

## Testing

- Unit tests
- API tests
- Queue tests
- Worker tests
- Retry tests
- Idempotency tests
- Concurrency tests
- Failure/DLQ tests

## Load Testing

Demonstrate:

```text
100 notifications
1000 notifications
5000 notifications
```

and measure:

```text
throughput
latency
queue backlog
failure rate
```

---

# 30. Planned Production Architecture Discussion

After completing the in-memory implementation, explain how it would evolve:

```text
                   API Servers
                 /      |      \
                /       |       \
               v        v        v
            Node.js  Node.js  Node.js
                \       |       /
                 \      |      /
                  +-----+----+
                        |
                        v
                  Redis / BullMQ
                        |
              +---------+---------+
              |         |         |
           Worker    Worker    Worker
              |
              v
       Notification Service
          /      |      \
       Email    SMS     Push
          |
          v
      External APIs

             +

          Postgres
             |
     Notification State
     Idempotency
     Attempts
     Audit
```

Potential production components:

```text
Postgres
Redis
BullMQ
```

The final discussion should explain:

### Why Redis/BullMQ?

- durable queue
- delayed jobs
- retry support
- job state
- distributed workers
- concurrency controls

### Why Postgres?

- durable notification state
- idempotency constraints
- audit history
- querying notification status

---

# 31. Important Design Tradeoffs to Explain in Interview

## EventEmitter vs Queue

EventEmitter:

```text
in-process
fast
simple
not durable
```

Queue:

```text
asynchronous work
buffering
durability if external
worker decoupling
```

## In-memory queue vs Redis/BullMQ

In-memory:

```text
easy
fast
good for coding exercise
not durable
```

Redis/BullMQ:

```text
durable
distributed
production-oriented
more operational complexity
```

## Worker concurrency vs Provider concurrency

Worker concurrency controls:

```text
overall processing capacity
```

Provider concurrency controls:

```text
specific external dependency load
```

## Retry vs DLQ

Retry:

```text
temporary failure
```

DLQ:

```text
permanent failure
or exhausted retries
```

## Direct calls vs Events

Direct calls:

```text
tight dependency
simple
easy to reason about
```

Events:

```text
decoupling
multiple consumers
asynchronous architecture
```

---

# 32. Recommended Next Implementation Steps

Continue from the current state in this exact order:

### Step 1

Finish and clean up lifecycle events and attempt tracking.

### Step 2

Add structured logging.

Create a small logger abstraction instead of scattered `console.log()`.

Example:

```js
logger.info("notification.processing", {
  notificationId,
});
```

### Step 3

Add metrics.

Track:

```text
notifications.created
notifications.sent
notifications.failed
notifications.retried
queue.depth
worker.active
```

### Step 4

Add:

```text
GET /health
GET /metrics
```

### Step 5

Improve retry behavior with:

```text
exponential backoff
+
jitter
```

### Step 6

Improve retry scheduling so workers aren't unnecessarily blocked by retry delays.

### Step 7

Add cancellation support if useful.

Potential endpoint:

```text
DELETE /notifications/:id
```

with clearly defined semantics.

### Step 8

Add comprehensive tests.

### Step 9

Run concurrency/load tests.

### Step 10

Perform a final refactor.

Remove:

- duplicated code
- temporary test files
- unnecessary abstractions
- dead code

### Step 11

Create final README explaining:

- architecture
- API
- design decisions
- failure handling
- concurrency
- tradeoffs
- production evolution

---

# 33. Machine-Coding Interview Expectations

The final solution should allow the candidate to explain:

> "A notification request is accepted synchronously, converted into a notification entity, and published as an application event. The event listener creates a background job in the queue. Workers consume jobs concurrently while provider-specific concurrency limiters protect external dependencies. Temporary provider failures are retried with exponential backoff, while permanent failures or exhausted retries go to a DLQ. Idempotency prevents duplicate notification creation. Notification state and delivery attempts are tracked separately from job execution. The service supports graceful shutdown so active work can complete."

That should be the core explanation.

---

# 34. Final End-State Checklist

Before considering the project complete, verify:

```text
[ ] POST /notifications works
[ ] GET /notifications/:id works

[ ] Input validation
[ ] Request size limit

[ ] EventEmitter event bus
[ ] Notification created event

[ ] Queue abstraction
[ ] Worker pool
[ ] Configurable concurrency

[ ] Email provider
[ ] SMS provider
[ ] Push provider

[ ] Provider-specific concurrency
[ ] Retryable errors
[ ] Non-retryable errors

[ ] Exponential backoff
[ ] Jitter
[ ] Maximum attempts
[ ] Dead letter queue

[ ] Idempotency
[ ] Notification status
[ ] Attempt history
[ ] Lifecycle events

[ ] Structured logging
[ ] Metrics
[ ] Health endpoint

[ ] Graceful shutdown

[ ] Unit tests
[ ] Integration/API tests
[ ] Retry tests
[ ] Idempotency tests
[ ] Concurrency tests
[ ] DLQ tests
[ ] Load tests

[ ] Final refactor
[ ] README
[ ] Production architecture discussion
```

---

# 35. Key Learning Goal

The purpose of this exercise is not merely to produce working code.

The candidate should understand the reasoning behind:

```text
HTTP
 ↓
Validation
 ↓
Idempotency
 ↓
Event
 ↓
Queue
 ↓
Worker
 ↓
Concurrency Limiter
 ↓
Provider
 ↓
Success / Failure
 ↓
Retry / DLQ
 ↓
State + Audit
```

And be able to explain how the in-memory implementation would evolve into:

```text
Node.js API
      ↓
Postgres
      ↓
Redis/BullMQ
      ↓
Distributed Workers
      ↓
External Notification Providers
```

The implementation should prioritize **clear boundaries, correctness, reliability, and explainability** over unnecessary framework or infrastructure complexity.
