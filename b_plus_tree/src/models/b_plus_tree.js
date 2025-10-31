export class BPlusTree {
  constructor(orderInternal = 3, orderLeaf = 2) {
    // According to the PDF:
    // p = 3 for internal nodes (order/degree)
    // p_leaf = 2 for leaf nodes (order/degree)
    this.orderInternal = orderInternal;
    this.orderLeaf = orderLeaf;
    this.root = new LeafNode(orderLeaf);
  }

  insert(key, pointer) {
    const result = this.root.insert(key, pointer);
    if (result) {
      const { newKey, newNode } = result;
      const newRoot = new InternalNode(this.orderInternal);
      newRoot.keys = [newKey];
      newRoot.children = [this.root, newNode];
      this.root = newRoot;
    }
  }

  delete(key) {
    this.root.delete(key);
    if (this.root instanceof InternalNode && this.root.children.length === 1) {
      this.root = this.root.children[0];
    }
  }

  search(key) {
    return this.root.search(key);
  }

  /* ==========================================================
   * VISUALIZATION FUNCTIONS
   * ========================================================== */

  visualize() {
    console.log("\n🌳 B+ TREE VISUALIZATION");
    const levels = [];
    this._collect_levels(this.root, 0, levels);

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const label = i === 0 ? "ROOT" : `LEVEL ${i}`;
      console.log(`\n${label}:`);
      const line = level
        .map(node => (node instanceof LeafNode
          ? `[Leaf: ${node.keys.join(", ")}]`
          : `[Internal: ${node.keys.join(", ")}]`))
        .join("  →  ");
      console.log(line);
    }
  }

  _collect_levels(node, level, levels) {
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);

    if (node instanceof InternalNode) {
      for (const child of node.children) {
        this._collect_levels(child, level + 1, levels);
      }
    }
  }

  print(node = this.root, level = 0) {
    const indent = "  ".repeat(level);
    if (node instanceof LeafNode) {
      console.log(`${indent}Leaf → [${node.keys.join(", ")}]`);
    } else {
      console.log(`${indent}Internal → [${node.keys.join(", ")}]`);
      for (const child of node.children) this.print(child, level + 1);
    }
  }
}

/* ------------------------- NODE CLASSES ------------------------- */

class InternalNode {
  constructor(order) {
    this.order = order; // p = max number of pointers (children)
    this.keys = [];     // can have at most (p-1) keys
    this.children = [];
  }

  insert(key, pointer) {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    const result = this.children[idx].insert(key, pointer);

    if (result) {
      const { newKey, newNode } = result;
      this.keys.splice(idx, 0, newKey);
      this.children.splice(idx + 1, 0, newNode);
    }

    // Split when children exceed order (max pointers)
    // For p=3: max 3 children → split at 4 children
    if (this.children.length > this.order) {
      const mid = Math.floor(this.keys.length / 2);
      const newKey = this.keys[mid];
      const right = new InternalNode(this.order);

      right.keys = this.keys.splice(mid + 1);
      right.children = this.children.splice(mid + 1);
      this.keys.splice(mid); // Middle key goes up to parent

      return { newKey, newNode: right };
    }
    return null;
  }

  delete(key) {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    this.children[idx].delete(key);

    if (this.children[idx].keys.length === 0) {
      this.children.splice(idx, 1);
      if (idx > 0) this.keys.splice(idx - 1, 1);
    }
  }

  search(key) {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    return this.children[idx].search(key);
  }
}

class LeafNode {
  constructor(order) {
    this.order = order; // p_leaf = max number of data pointers
    this.keys = [];     // can have at most p_leaf keys
    this.pointers = [];
    this.next = null;
  }

  insert(key, pointer) {
    let idx = 0;
    while (idx < this.keys.length && key > this.keys[idx]) idx++;

    // Update if key already exists
    if (this.keys[idx] === key) {
      this.pointers[idx] = pointer;
      return null;
    }

    // Insert new key-pointer pair
    this.keys.splice(idx, 0, key);
    this.pointers.splice(idx, 0, pointer);

    // Split when keys exceed order (max keys in leaf)
    // For p_leaf=2: max 2 keys → split at 3 keys
    if (this.keys.length > this.order) {
      const mid = Math.floor(this.keys.length / 2);
      const right = new LeafNode(this.order);
      
      // Split keys and pointers
      right.keys = this.keys.splice(mid);
      right.pointers = this.pointers.splice(mid);
      
      // Maintain linked list of leaves
      right.next = this.next;
      this.next = right;

      // Smallest key in right node goes up (and stays in leaf)
      const newKey = right.keys[0];
      return { newKey, newNode: right };
    }
    return null;
  }

  delete(key) {
    const idx = this.keys.indexOf(key);
    if (idx !== -1) {
      this.keys.splice(idx, 1);
      this.pointers.splice(idx, 1);
    }
  }

  search(key) {
    const idx = this.keys.indexOf(key);
    return idx !== -1 ? this.pointers[idx] : null;
  }
}