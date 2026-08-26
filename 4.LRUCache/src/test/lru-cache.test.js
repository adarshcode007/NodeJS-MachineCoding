// import LRUCache from "../cache/LRUCache.js";

// const cache = new LRUCache(3);

// cache.set("A", 1);
// cache.set("B", 2);
// cache.set("C", 3);

// console.log(cache.keys()); // ["C", "B", "A"]

// console.log(cache.get("A")); // 1

// console.log(cache.keys()); // ["A", "C", "B"]

// cache.set("D", 5);

// console.log(cache.keys()); // ["D", "A", "C"]

// console.log(cache.get("B")); // undefined

// console.log(cache.size()); // 3

// cache.set("D", 10);

import { describe, it, expect, vi } from "vitest";
import LRUCache from "../cache/LRUCache.js";

describe("LRU Cache", () => {
  it("should store and retrieve values", () => {
    const cache = new LRUCache(3);

    cache.set("A", 100);
    cache.set("B", 200);

    expect(cache.get("A")).toBe(100);
    expect(cache.get("B")).toBe(200);
  });

  it("should return undefined for a missing key", () => {
    const cache = new LRUCache(3);

    expect(cache.get("A")).toBe(undefined);
  });

  it("should move accessed item to MRU position", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    expect(cache.keys()).toStrictEqual(["C", "B", "A"]);

    cache.get("A");

    expect(cache.keys()).toStrictEqual(["A", "C", "B"]);
  });

  it("should evict the least recently used item", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    cache.set("D", 4);

    expect(cache.get("A")).toBeUndefined();
    expect(cache.get("B")).toBe(2);
    expect(cache.get("C")).toBe(3);
    expect(cache.get("D")).toBe(4);
  });

  it("should evict the correct item after access", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    cache.get("A");

    cache.set("D", 4);

    expect(cache.get("B")).toBeUndefined();

    expect(cache.get("A")).toBe(1);
    expect(cache.get("C")).toBe(3);
    expect(cache.get("D")).toBe(4);
  });

  it("should update existing value without increasing size", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);

    cache.set("A", 100);

    expect(cache.get("A")).toBe(100);
    expect(cache.size()).toBe(2);
    expect(cache.keys()).toEqual(["A", "B"]);
  });

  it("should delete an existing key", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);

    expect(cache.delete("A")).toBe(true);

    expect(cache.has("A")).toBe(false);
    expect(cache.get("A")).toBeUndefined();
    expect(cache.size()).toBe(1);
  });

  it("should return false when deleting missing key", () => {
    const cache = new LRUCache(3);

    expect(cache.delete("A")).toBe(false);
  });

  it("should correctly check whether a key exists", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);

    expect(cache.has("A")).toBe(true);
    expect(cache.has("B")).toBe(false);
  });

  it("has() should not change LRU order", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    cache.has("A");

    expect(cache.keys()).toEqual(["C", "B", "A"]);
  });

  it("peek() should not change LRU order", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    expect(cache.peek("A")).toBe(1);

    expect(cache.keys()).toEqual(["C", "B", "A"]);
  });

  it("should clear the entire cache", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.keys()).toEqual([]);

    expect(cache.get("A")).toBeUndefined();
  });

  it("should work correctly with capacity 1", () => {
    const cache = new LRUCache(1);

    cache.set("A", 1);

    expect(cache.get("A")).toBe(1);

    cache.set("B", 2);

    expect(cache.get("A")).toBeUndefined();
    expect(cache.get("B")).toBe(2);

    expect(cache.size()).toBe(1);
  });

  it("should reject invalid capacity", () => {
    expect(() => new LRUCache(0)).toThrow();
    expect(() => new LRUCache(-1)).toThrow();
    expect(() => new LRUCache(1.5)).toThrow();
    expect(() => new LRUCache("3")).toThrow();
  });

  it("should support null values", () => {
    const cache = new LRUCache(2);

    cache.set("A", null);

    expect(cache.has("A")).toBe(true);
    expect(cache.get("A")).toBeNull();
  });

  it("should maintain internal data structure invariants", () => {
    const cache = new LRUCache(3);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    expect(cache.validate()).toBe(true);

    cache.get("A");

    expect(cache.validate()).toBe(true);

    cache.delete("B");

    expect(cache.validate()).toBe(true);

    cache.set("D", 4);

    expect(cache.validate()).toBe(true);

    console.log(cache.toJSON());
  });

  it("should expire entries after TTL", () => {
    vi.useFakeTimers();

    const cache = new LRUCache(3);

    cache.set("A", 100, {
      ttl: 5000,
    });

    expect(cache.get("A")).toBe(100);

    vi.advanceTimersByTime(5001);

    expect(cache.get("A")).toBeUndefined();

    vi.useRealTimers();
  });

  it("should keep entries without TTL", () => {
    vi.useFakeTimers();

    const cache = new LRUCache(3);

    cache.set("A", 100);

    vi.advanceTimersByTime(100000);

    expect(cache.get("A")).toBe(100);

    vi.useRealTimers();
  });

  it("should reset TTL when an existing key is updated", () => {
    vi.useFakeTimers();

    const cache = new LRUCache(3);

    cache.set("A", 100, {
      ttl: 5000,
    });

    vi.advanceTimersByTime(4000);

    cache.set("A", 200, {
      ttl: 5000,
    });

    vi.advanceTimersByTime(4000);

    expect(cache.get("A")).toBe(200);

    vi.advanceTimersByTime(1001);

    expect(cache.get("A")).toBeUndefined();

    vi.useRealTimers();
  });

  it("should track cache hits", () => {
    const cache = new LRUCache(3);

    cache.set("A", 100);

    cache.get("A");
    cache.get("A");

    expect(cache.stats().hits).toBe(2);
    expect(cache.stats().misses).toBe(0);
  });

  it("should track cache misses", () => {
    const cache = new LRUCache(3);

    cache.get("A");
    cache.get("B");

    expect(cache.stats().hits).toBe(0);
    expect(cache.stats().misses).toBe(2);
  });

  it("should track LRU evictions", () => {
    const cache = new LRUCache(2);

    cache.set("A", 1);
    cache.set("B", 2);
    cache.set("C", 3);

    expect(cache.stats().evictions).toBe(1);
  });

  it("should track expirations", () => {
    vi.useFakeTimers();

    const cache = new LRUCache(2);

    cache.set("A", 1, {
      ttl: 1000,
    });

    vi.advanceTimersByTime(1001);

    expect(cache.get("A")).toBeUndefined();

    expect(cache.stats().misses).toBe(1);
    expect(cache.stats().expirations).toBe(1);

    vi.useRealTimers();
  });
});
