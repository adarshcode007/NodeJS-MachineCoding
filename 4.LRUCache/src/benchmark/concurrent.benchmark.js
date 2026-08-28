import LRUCache from "../cache/LRUCache.js";

const cache = new LRUCache(10_000);

const WORKERS = 100;
const OPERATIONS_PER_WORKER = 10_000;
const KEY_SPACE = 50_000;

async function worker(workerId) {
  for (let i = 0; i < OPERATIONS_PER_WORKER; i++) {
    const key = `key-${Math.floor(Math.random() * KEY_SPACE)}`;

    if (Math.random() < 0.8) {
      cache.get(key);
    } else {
      cache.set(key, {
        workerId,
        operation: i,
      });
    }

    if (i % 1000 === 0) {
      await Promise.resolve();
    }
  }
}

const totalOperations = WORKERS * OPERATIONS_PER_WORKER;

const start = performance.now();

await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));

const durationMs = performance.now() - start;

const operationsPerSecond = (totalOperations / durationMs) * 1000;

console.log({
  workers: WORKERS,
  totalOperations,
  durationMs,
  operationsPerSecond,
  size: cache.size(),
  stats: cache.stats(),
});

cache.validate();

console.log("Cache integrity: OK");
