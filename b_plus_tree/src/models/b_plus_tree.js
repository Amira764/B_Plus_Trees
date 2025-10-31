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
    const numericKey = Number(key);
    if (isNaN(numericKey)) {
      throw new Error('Invalid key: must be a number');
    }
    const result = this.root.insert(numericKey, pointer);
    if (result) {
      const { newKey, newNode } = result;
      const newRoot = new InternalNode(this.orderInternal);
      newRoot.keys = [newKey];
      newRoot.children = [this.root, newNode];
      this.root = newRoot;
    }
  }

  delete(key) {
    const numericKey = Number(key);
    if (isNaN(numericKey)) {
      throw new Error('Invalid key: must be a number');
    }
    
    const result = this.root.delete(numericKey);
    const deletedKey = result?.needsMerge ? result.deletedKey : result;
    
    // Special handling for root
    if (this.root instanceof InternalNode) {
      // If root has only one child, make that child the new root
      if (this.root.children.length === 1) {
        this.root = this.root.children[0];
      }
      // If root is empty and not a leaf, make its only child the new root
      else if (this.root.keys.length === 0 && !(this.root instanceof LeafNode)) {
        this.root = this.root.children[0];
      }
      // If root is a leaf node and empty, reset the tree
      else if (this.root instanceof LeafNode && this.root.keys.length === 0) {
        this.root = new LeafNode(this.orderLeaf);
      }
    }
    
    return deletedKey;
  }

  search(key) {
    const numericKey = Number(key);
    if (isNaN(numericKey)) {
      throw new Error('Invalid key: must be a number');
    }
    return this.root.search(numericKey);
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
    
    const result = this.children[idx].delete(key);
    const deletedKey = result?.needsMerge ? result.deletedKey : result;

    // If a key was deleted and it exists in the internal nodes, update them
    if (deletedKey !== undefined) {
      // Find the key in current node's keys
      const keyIdx = this.keys.indexOf(deletedKey);
      if (keyIdx !== -1) {
        // If we find the key in this node, replace it with the smallest key from the right subtree
        if (idx + 1 < this.children.length) {
          const smallestKey = this.findSmallestKey(this.children[idx + 1]);
          this.keys[keyIdx] = smallestKey;
        } else {
          // If no right subtree, remove the key
          this.keys.splice(keyIdx, 1);
        }
      }
    }

    // Handle children that need merging
    if (result?.needsMerge) {
      const child = this.children[idx];
      const minChildren = Math.ceil(child instanceof LeafNode ? child.order / 2 : child.order / 2);
      
      // Try to borrow from siblings first
      let borrowed = false;
      
      // Try right sibling
      if (idx < this.children.length - 1) {
        const rightSibling = this.children[idx + 1];
        if (rightSibling.children?.length > minChildren || rightSibling.keys.length > minChildren) {
          child.borrowFromSibling(this, idx + 1);
          borrowed = true;
        }
      }
      
      // Try left sibling if right borrow failed
      if (!borrowed && idx > 0) {
        const leftSibling = this.children[idx - 1];
        if (leftSibling.children?.length > minChildren || leftSibling.keys.length > minChildren) {
          child.borrowFromSibling(this, idx - 1);
          borrowed = true;
        }
      }
      
      // If borrowing failed, merge with a sibling
      if (!borrowed) {
        if (idx < this.children.length - 1) {
          // Merge with right sibling
          child.merge(this, idx + 1);
        } else if (idx > 0) {
          // Merge with left sibling
          child.merge(this, idx - 1);
        }
      }
    }

    // Check if this node needs to be merged
    const minChildren = Math.ceil(this.order / 2);
    if (this.children.length < minChildren) {
      return { deletedKey, needsMerge: true };
    }

    return deletedKey;
  }

  merge(parent, siblingIdx) {
    const sibling = parent.children[siblingIdx];
    const parentKey = parent.keys[siblingIdx > 0 ? siblingIdx - 1 : siblingIdx];

    if (siblingIdx > 0) {
      // Merge with left sibling
      sibling.keys.push(parentKey);
      sibling.keys.push(...this.keys);
      sibling.children.push(...this.children);
    } else {
      // Merge with right sibling
      this.keys.push(parentKey);
      this.keys.push(...sibling.keys);
      this.children.push(...sibling.children);
      parent.children[siblingIdx] = this;
    }

    // Remove the used parent key and the empty node
    parent.keys.splice(siblingIdx > 0 ? siblingIdx - 1 : siblingIdx, 1);
    parent.children.splice(siblingIdx > 0 ? siblingIdx : siblingIdx + 1, 1);
  }

  findSmallestKey(node) {
    while (!(node instanceof LeafNode)) {
      node = node.children[0];
    }
    return node.keys[0];
  }

  borrowFromSibling(parent, siblingIdx) {
    const sibling = parent.children[siblingIdx];
    if (siblingIdx > 0) {
      // Borrow from left sibling
      const siblingKey = sibling.keys.pop();
      const siblingChild = sibling.children.pop();
      const parentKey = parent.keys[siblingIdx - 1];
      
      this.keys.unshift(parentKey);
      this.children.unshift(siblingChild);
      parent.keys[siblingIdx - 1] = siblingKey;
    } else {
      // Borrow from right sibling
      const siblingKey = sibling.keys.shift();
      const siblingChild = sibling.children.shift();
      const parentKey = parent.keys[siblingIdx];
      
      this.keys.push(parentKey);
      this.children.push(siblingChild);
      parent.keys[siblingIdx] = siblingKey;
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
    const idx = this.keys.findIndex(k => k === key);
    if (idx !== -1) {
      const deletedKey = this.keys[idx];
      this.keys.splice(idx, 1);
      this.pointers.splice(idx, 1);

      // Check if node needs to be merged (less than ceil(order/2) keys)
      const minKeys = Math.ceil(this.order / 2);
      if (this.keys.length < minKeys) {
        return { deletedKey, needsMerge: true };
      }
      
      return deletedKey;  // Return the deleted key so parent nodes can update
    }
    return undefined;
  }

  merge(parent, siblingIdx) {
    const sibling = parent.children[siblingIdx];
    const parentKeyIdx = siblingIdx > 0 ? siblingIdx - 1 : siblingIdx;
    
    if (siblingIdx > 0) {
      // Merge with left sibling
      sibling.keys.push(...this.keys);
      sibling.pointers.push(...this.pointers);
      sibling.next = this.next;
    } else {
      // Merge with right sibling
      this.keys.push(...sibling.keys);
      this.pointers.push(...sibling.pointers);
      this.next = sibling.next;
      parent.children[siblingIdx] = this;
    }
    
    // Remove the separator key and the empty node from parent
    parent.keys.splice(parentKeyIdx, 1);
    parent.children.splice(siblingIdx > 0 ? siblingIdx : siblingIdx + 1, 1);
  }

  borrowFromSibling(parent, siblingIdx) {
    const sibling = parent.children[siblingIdx];
    if (siblingIdx > 0) {
      // Borrow from left sibling
      const siblingKey = sibling.keys.pop();
      const siblingPointer = sibling.pointers.pop();
      this.keys.unshift(siblingKey);
      this.pointers.unshift(siblingPointer);
      parent.keys[siblingIdx - 1] = this.keys[0];
    } else {
      // Borrow from right sibling
      const siblingKey = sibling.keys.shift();
      const siblingPointer = sibling.pointers.shift();
      this.keys.push(siblingKey);
      this.pointers.push(siblingPointer);
      parent.keys[siblingIdx] = sibling.keys[0];
    }
  }

  search(key) {
    const idx = this.keys.indexOf(key);
    return idx !== -1 ? this.pointers[idx] : null;
  }
}