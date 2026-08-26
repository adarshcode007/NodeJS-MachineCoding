import Node from "./Node.js";

class DoublyLinkedList {
  constructor() {
    this.head = new Node(null, null);
    this.tail = new Node(null, null);

    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  addToFront(node) {
    node.next = this.head.next;
    node.prev = this.head;

    this.head.next.prev = node;
    this.head.next = node;
  }

  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;

    node.prev = null;
    node.next = null;
  }

  removeLast() {
    const node = this.tail.prev;

    if (node === this.head) return null;

    this.remove(node);

    return node;
  }

  moveToFront(node) {
    this.remove(node);
    this.addToFront(node);
  }

  keys() {
    const keys = [];

    let current = this.head.next;

    while (current !== this.tail) {
      keys.push(current.key);
      current = current.next;
    }

    return keys;
  }

  values() {
    const values = [];

    let current = this.head.next;

    while (current !== this.tail) {
      values.push(current.value);
      current = current.next;
    }
    return values;
  }
}

export default DoublyLinkedList;
