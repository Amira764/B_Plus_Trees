export class LeafNode {
  constructor(order) {
    this.order = order; // p_leaf = max number of data pointers
    this.keys = [];     // can have at most p_leaf keys
    this.pointers = [];
    this.next = null;
  }

  insert(key, pointer) {
    let idx = 0;
    // Use numeric comparison
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

  delete(key)
  {
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
    const idx = this.keys.findIndex(k => k === key);
    return idx !== -1 ? this.pointers[idx] : null;
  }
}