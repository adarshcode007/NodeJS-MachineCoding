import LRUCache from "../cache/LRUCache.js";

const cache = new LRUCache(10_000);

const TOTAL_OPERATIONS = 1_000_000;

console.time("benchmark");

for (let i = 0; i < TOTAL_OPERATIONS; i++) {
  cache.set(`Key:${i} `, i);
}

console.timeEnd("benchmark");

console.log({
  size: cache.size(),
  capacity: cache.capacity,
  stats: cache.stats(),
});
