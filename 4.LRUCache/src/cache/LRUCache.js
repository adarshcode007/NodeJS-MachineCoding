import DoublyLinkedList from "./DoubleLinkedList.js";
import Node from "./Node.js";

class LRUCache {
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error("Cache capacity must be a positive integer");
    }

    this.capacity = capacity;
    this.cache = new Map();
    this.list = new DoublyLinkedList();

    this.statsData = {
      hits: 0,
      missess: 0,
      evictions: 0,
      expirations: 0,
    };
  }

  _getExpirationTime(options) {
    if (!options || options.ttl === undefined) return null;

    if (!Number.isFinite(options.ttl) || options.ttl <= 0) {
      throw new Error("TTL must be a positive number");
    }

    return Date.now() + options.ttl;
  }

  _isExpired(node) {
    return node.expiresAt !== null && Date.now() >= node.expiresAt;
  }

  get(key) {
    const node = this.cache.get(key);

    if (!node) {
      this.statsData.missess++;
      return undefined;
    }

    if (this._isExpired(node)) {
      this.statsData.missess++;
      this.statsData.expirations++;
      this.list.remove(node);
      this.cache.delete(key);

      return undefined;
    }
    this.list.moveToFront(node);
    this.statsData.hits++;
    return node.value;
  }

  set(key, value, options = {}) {
    const expiresAt = this._getExpirationTime(options);
    const existingNode = this.cache.get(key);

    if (existingNode) {
      existingNode.value = value;
      existingNode.expiresAt = expiresAt;
      this.list.moveToFront(existingNode);
      return;
    }

    const node = new Node(key, value, expiresAt);
    this.cache.set(key, node);
    this.list.addToFront(node);

    if (this.cache.size > this.capacity) {
      const evictedNode = this.list.removeLast();
      this.cache.delete(evictedNode.key);
      this.statsData.evictions++;
    }
  }

  delete(key) {
    const node = this.cache.get(key);

    if (!node) return false;

    this.list.remove(node);
    this.cache.delete(key);

    return true;
  }

  has(key) {
    const node = this.cache.get(key);

    if (!node) return false;

    if (this._isExpired(node)) {
      this.list.remove(node);
      this.cache.delete(key);

      return false;
    }
    return true;
  }

  clear() {
    this.cache.clear();
    this.list = new DoublyLinkedList();
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return this.list.keys();
  }

  values() {
    return this.list.values();
  }

  peek(key) {
    const node = this.cache.get(key);

    if (!node) {
      this.statsData.missess++;
      return undefined;
    }

    if (this._isExpired(node)) {
      this.statsData.missess++;
      this.statsData.expirations++;
      this.list.delete(key);
      this.cache.remove(node);
      return undefined;
    }

    this.statsData.hits++;

    return node.value;
  }

  validate() {
    this.list.validate();

    const listKeys = new Set();
    let current = this.list.head.next;

    while (current !== this.list.tail) {
      listKeys.add(current.key);

      if (!this.cache.has(current.key)) {
        throw new Error(
          `Node with key "${current.key}" missing from cache Map`,
        );
      }

      if (this.cache.get(current.key) !== current) {
        throw new Error(
          `Map points to incorrect node for key "${current.key}"`,
        );
      }

      current = current.next;
    }

    if (listKeys.size !== this.cache.size) {
      throw new Error("Map and linked list are out of sync");
    }

    for (const key of this.cache.keys()) {
      if (!listKeys.has(key)) {
        throw new Error(`Cache key "${key}" missing from linked list`);
      }
    }

    return true;
  }

  toJSON() {
    return {
      capacity: this.capacity,
      size: this.size(),
      keys: this.keys(),
      values: this.values(),
    };
  }

  stats() {
    const totalRequests = this.statsData.hits + this.statsData.missess;

    const hitRate =
      totalRequests === 0 ? 0 : this.statsData.hits / totalRequests;

    return {
      size: this.size(),
      capacity: this.capacity,
      hits: this.statsData.hits,
      misses: this.statsData.missess,
      hitRate,
      evictions: this.statsData.evictions,
      expirations: this.statsData.expirations,
    };
  }

  resetStats() {
    this.statsData = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
    };
  }
}

export default LRUCache;

// lazy expiration- node will exist in the cache even after expiration
//      but when try to access it will remove it
