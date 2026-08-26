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
  }

  get(key) {
    const node = this.cache.get(key);

    if (!node) return undefined; // doesnt exist because null can be passed as a value

    this.list.moveToFront(node);

    return node.value;
  }

  set(key, value) {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      existingNode.value = value;
      this.list.moveToFront(existingNode);
      return;
    }

    const node = new Node(key, value);
    this.cache.set(key, node);
    this.list.addToFront(node);

    if (this.cache.size > this.capacity) {
      const evictedNode = this.list.removeLast();
      this.cache.delete(evictedNode.key);
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
    return this.cache.has(key);
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

    if (!node) return undefined;

    return node.value;
  }
}

export default LRUCache;
