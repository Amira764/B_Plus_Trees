import { LeafNode } from './LeafNode';

export class InternalNode {
  constructor(order) {
    this.order = order; // p = max number of pointers (children)
    this.keys = [];     // can have at most (p-1) keys
    this.children = [];
  }

  getInsertIndex(key) {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    return idx;
  }

  insertKeyAndChild(key, node, index) {
    this.keys.splice(index, 0, key);
    this.children.splice(index + 1, 0, node);
  }

  split() {
    const mid = Math.floor(this.keys.length / 2);
    const newKey = this.keys[mid];
    const right = new InternalNode(this.order);

    right.keys = this.keys.splice(mid + 1);
    right.children = this.children.splice(mid + 1);
    this.keys.splice(mid); // Middle key goes up to parent

    return { newKey, newNode: right };
  }

  needsSplit() {
    return this.children.length > this.order;
  }

  insert(key, pointer) {
    const idx = this.getInsertIndex(key);
    const result = this.children[idx].insert(key, pointer);

    if (result) {
      this.insertKeyAndChild(result.newKey, result.newNode, idx);
    }

    if (this.needsSplit()) {
      return this.split();
    }
    return null;
  }

  findLargestKeyInSubtree(node) {
    let current = node;
    while (!(current instanceof LeafNode)) {
      current = current.children[current.children.length - 1];
    }
    return current.keys[current.keys.length - 1];
  }

  getReplacementKey(idx, keyIdx) {
    // Try right subtree first
    if (idx + 1 < this.children.length && this.children[idx + 1].keys.length > 0) {
      return this.findSmallestKey(this.children[idx + 1]);
    }
    // Try left subtree
    if (idx > 0 && this.children[idx - 1].keys.length > 0) {
      return this.findLargestKeyInSubtree(this.children[idx - 1]);
    }
    return null;
  }

  removeEmptyLeafNode(idx) {
    const child = this.children[idx];
    if (idx > 0) {
      const prevLeaf = this.children[idx - 1];
      if (prevLeaf instanceof LeafNode) {
        prevLeaf.next = child.next;
      }
    }
    this.children.splice(idx, 1);
    if (idx > 0) this.keys.splice(idx - 1, 1);
  }

  removeEmptyInternalNode(idx, child) {
    const validChildren = child.children.filter(grandChild => 
      grandChild && grandChild.keys.length > 0
    );
    if (validChildren.length === 0) {
      this.children.splice(idx, 1);
      if (idx > 0) this.keys.splice(idx - 1, 1);
    }
  }

  cleanupEmptyNodes() {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (!child || child.keys.length === 0) {
        if (child instanceof LeafNode) {
          this.removeEmptyLeafNode(i);
        } else {
          this.removeEmptyInternalNode(i, child);
        }
      }
    }
  }

  delete(key) {
    const idx = this.getInsertIndex(key);
    const result = this.children[idx].delete(key);
    const deletedKey = result?.needsMerge ? result.deletedKey : result;

    if (deletedKey !== undefined) {
      const keyIdx = this.keys.indexOf(deletedKey);
      if (keyIdx !== -1) {
        const replacementKey = this.getReplacementKey(idx, keyIdx);
        if (replacementKey !== null) {
          this.keys[keyIdx] = replacementKey;
        } else {
          this.keys.splice(keyIdx, 1);
        }
      }
    }

    this.cleanupEmptyNodes();

    // Handle children that need merging
    if (result?.needsMerge) {
      if (this.handleChildMerging(idx, child) === false) {
        return { deletedKey, needsMerge: true };
      }
    }

    if (this.needsMerging()) {
      return { deletedKey, needsMerge: true };
    }

    return deletedKey;
  }

  needsMerging() {
    const minChildren = Math.ceil(this.order / 2);
    return this.children.length < minChildren;
  }

  getMinKeys(node) {
    return Math.ceil(node.order / 2) - 1;
  }

  canBorrowFromSibling(sibling) {
    return sibling && sibling.keys.length > this.getMinKeys(sibling);
  }

  tryBorrowFromSibling(child, siblingIdx, isRightSibling) {
    const sibling = this.children[siblingIdx];
    if (this.canBorrowFromSibling(sibling)) {
      const oldLength = child.keys.length;
      child.borrowFromSibling(this, siblingIdx);
      return child.keys.length > oldLength;
    }
    return false;
  }

  tryMergeWithSibling(child, siblingIdx) {
    const sibling = this.children[siblingIdx];
    if (sibling) {
      const mergedNode = child.merge(this, siblingIdx);
      return mergedNode && mergedNode.keys.length > 0;
    }
    return false;
  }

  handleChildMerging(idx, child) {
    if (!child) return false;

    // Try borrowing from right sibling
    if (idx < this.children.length - 1 && 
        this.tryBorrowFromSibling(child, idx + 1, true)) {
      return true;
    }

    // Try borrowing from left sibling
    if (idx > 0 && 
        this.tryBorrowFromSibling(child, idx - 1, false)) {
      return true;
    }

    // Try merging with right sibling
    if (idx < this.children.length - 1 && 
        this.tryMergeWithSibling(child, idx + 1)) {
      return true;
    }

    // Try merging with left sibling
    if (idx > 0 && 
        this.tryMergeWithSibling(this.children[idx - 1], idx)) {
      return true;
    }

    return false;
  }

  merge(parent, siblingIdx) {
    const sibling = parent.children[siblingIdx];
    const isRightSibling = siblingIdx > 0 ? false : true;
    const parentKey = parent.keys[isRightSibling ? siblingIdx : siblingIdx - 1];
    const targetNode = isRightSibling ? this : sibling;
    const sourceNode = isRightSibling ? sibling : this;

    // First push the parent key as it becomes part of the merged node
    targetNode.keys.push(parentKey);

    // Then merge the keys and children
    targetNode.keys.push(...sourceNode.keys);
    targetNode.children.push(...sourceNode.children);

    // Important: Keep only the valid children
    targetNode.children = targetNode.children.filter(child => child && child.keys.length > 0);
    
    // If merging with right sibling, we need to update the parent's reference
    if (!isRightSibling) {
      parent.children[siblingIdx] = targetNode;
    }

    // Remove the parent key and the empty sibling node
    const parentKeyIndex = isRightSibling ? siblingIdx : siblingIdx - 1;
    parent.keys.splice(parentKeyIndex, 1);
    parent.children.splice(isRightSibling ? siblingIdx + 1 : siblingIdx, 1);

    // Make sure parent keys and children are properly aligned
    if (parent.children.length - 1 !== parent.keys.length) {
      parent.keys = parent.keys.slice(0, parent.children.length - 1);
    }

    return targetNode;
  }

  borrowFromSibling(parent, siblingIdx) {
    const sibling = parent.children[siblingIdx];
    if (!sibling || sibling.keys.length === 0) return false;

    const isRightSibling = siblingIdx > siblingIdx - 1;
    const parentKeyIdx = isRightSibling ? siblingIdx - 1 : siblingIdx;

    if (!isRightSibling) {
      // Borrow from left sibling
      const siblingKey = sibling.keys.pop();
      const siblingChild = sibling.children.pop();
      const parentKey = parent.keys[parentKeyIdx];
      
      if (siblingChild) {
        this.keys.unshift(parentKey);
        this.children.unshift(siblingChild);
        parent.keys[parentKeyIdx] = siblingKey;
        return true;
      }
    } else {
      // Borrow from right sibling
      const siblingKey = sibling.keys.shift();
      const siblingChild = sibling.children.shift();
      const parentKey = parent.keys[parentKeyIdx];
      
      if (siblingChild) {
        this.keys.push(parentKey);
        this.children.push(siblingChild);
        parent.keys[parentKeyIdx] = siblingKey;
        return true;
      }
    }
    return false;
  }

  findSmallestKey(node) {
    while (!(node instanceof LeafNode)) {
      node = node.children[0];
    }
    return node.keys[0];
  }

  search(key) {
    let idx = 0;
    // Use numeric comparison
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    return this.children[idx].search(key);
  }
}