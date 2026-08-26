class Node {
  constructor(key, value, expiresAt = null) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;

    this.prev = null;
    this.next = null;
  }
}

export default Node;
