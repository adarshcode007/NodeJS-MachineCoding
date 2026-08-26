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

import { describe, it, expect } from "vitest";
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
});
