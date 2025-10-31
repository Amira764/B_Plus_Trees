// Simple B+ Tree implementation in JS for visualization purposes.
// Emits snapshots (serialised tree) after each notable step.

let _idCounter = 1;
function nextId() { return _idCounter++; }

class Node {
  constructor(isLeaf = false) {
    this.id = nextId();
    this.keys = [];
    this.parent = null;
    this.isLeaf = isLeaf;
    this.children = []; // for internal
    this.values = []; // for leaf
    this.next = null; // leaf linked list
    this.prev = null;
  }
}

class BPlusTree {
  constructor({ leafOrder = 3, internalOrder = 3, unique = true } = {}) {
    this.leafOrder = leafOrder;
    this.internalOrder = internalOrder;
    this.unique = unique;
    this.root = new Node(true);
  }

  // serialize returns a snapshot object describing the tree
  serialize(meta = {}) {
    const nodes = [];
    const q = [this.root];
    const seen = new Set();
    while (q.length) {
      const n = q.shift();
      if (!n || seen.has(n.id)) continue;
      seen.add(n.id);
      const item = {
        id: n.id,
        isLeaf: n.isLeaf,
        keys: [...n.keys],
        children: n.isLeaf ? [] : n.children.map(c => c.id),
        values: n.isLeaf ? [...n.values] : undefined,
        next: n.isLeaf && n.next ? n.next.id : null,
        parent: n.parent ? n.parent.id : null,
      };
      nodes.push(item);
      if (!n.isLeaf) {
        for (const c of n.children) q.push(c);
      }
    }
    return { rootId: this.root.id, nodes, meta };
  }

  _findLeaf(key) {
    let node = this.root;
    while (!node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) i++;
      node = node.children[i];
    }
    return node;
  }

  insert(key) {
    const snapshots = [];
    const leaf = this._findLeaf(key);

    if (this.unique && leaf.keys.includes(key)) {
      // no-op, but return snapshot showing no change
      snapshots.push(this.serialize({ action: 'duplicate-rejected', key }));
      return snapshots;
    }

    // insert sorted
    let idx = 0;
    while (idx < leaf.keys.length && leaf.keys[idx] < key) idx++;
    leaf.keys.splice(idx, 0, key);
    leaf.values.splice(idx, 0, null);
    snapshots.push(this.serialize({ action: 'insert', key }));

    if (leaf.keys.length > this.leafOrder) {
      this._splitLeaf(leaf, snapshots);
    }

    return snapshots;
  }

  _splitLeaf(leaf, snapshots) {
    const right = new Node(true);
    const N = leaf.keys.length;
    const mid = Math.floor(N / 2);
    right.keys = leaf.keys.splice(mid);
    right.values = leaf.values.splice(mid);
    // adjust links
    right.next = leaf.next;
    if (right.next) right.next.prev = right;
    leaf.next = right;
    right.prev = leaf;

    const parent = leaf.parent;
    right.parent = parent;
    const promoted = right.keys[0];

    if (!parent) {
      const newRoot = new Node(false);
      newRoot.keys = [promoted];
      newRoot.children = [leaf, right];
      leaf.parent = newRoot;
      right.parent = newRoot;
      this.root = newRoot;
      snapshots.push(this.serialize({ action: 'split-leaf', promoted }));
      return;
    }

    // insert right in parent's children after leaf
    const pos = parent.children.indexOf(leaf) + 1;
    parent.children.splice(pos, 0, right);
    parent.keys.splice(pos - 1, 0, promoted);
    right.parent = parent;
    snapshots.push(this.serialize({ action: 'split-leaf', promoted }));

    if (parent.children.length > this.internalOrder) {
      this._splitInternal(parent, snapshots);
    }
  }

  _splitInternal(node, snapshots) {
    const C = node.children.length;
    const midIndex = Math.floor((C + 1) / 2);
    const right = new Node(false);
    right.children = node.children.splice(midIndex);
    for (const c of right.children) c.parent = right;
    right.keys = node.keys.splice(midIndex);
    const promoted = right.keys[0] || null;

    const parent = node.parent;
    right.parent = parent;
    if (!parent) {
      const newRoot = new Node(false);
      const keyToPromote = promoted || (right.keys[0] || null);
      newRoot.keys = [keyToPromote];
      newRoot.children = [node, right];
      node.parent = newRoot;
      right.parent = newRoot;
      this.root = newRoot;
      snapshots.push(this.serialize({ action: 'split-internal', promoted: keyToPromote }));
      return;
    }

    const insertPos = parent.children.indexOf(node) + 1;
    parent.children.splice(insertPos, 0, right);
    const keyInsertPos = insertPos - 1;
    const keyToInsert = promoted || (right.keys[0] || null);
    parent.keys.splice(keyInsertPos, 0, keyToInsert);
    snapshots.push(this.serialize({ action: 'split-internal', promoted: keyToInsert }));

    if (parent.children.length > this.internalOrder) {
      this._splitInternal(parent, snapshots);
    }
  }

  delete(key) {
    const snapshots = [];
    const leaf = this._findLeaf(key);
    let removed = false;
    for (let i = leaf.keys.length - 1; i >= 0; i--) {
      if (leaf.keys[i] === key) {
        leaf.keys.splice(i, 1);
        leaf.values.splice(i, 1);
        removed = true;
      }
    }
    snapshots.push(this.serialize({ action: 'delete', key, removed }));
    // Note: borrowing/merging not implemented in this simple visualiser
    return snapshots;
  }

  search(key) {
    const snapshots = [];
    const leaf = this._findLeaf(key);
    const found = leaf.keys.includes(key);
    snapshots.push(this.serialize({ action: 'search', key, found, leafId: leaf.id }));
    return snapshots;
  }
}

export default BPlusTree;
