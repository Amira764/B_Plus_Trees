export class LeafNode
{
  constructor(order)
  {
    this.order = order;
    this.keys = [];
    this.pointers = [];
    this.blockPointers = []; // Stores { blockId, recordIndex }
    this.next = null;
  }

  insert(key, pointer, BlockPointer)
  {
    const idx = this._findInsertionIndex(key);

    // Update if key already exists
    if (this.keys[idx] === key)
    {
      this.pointers[idx] = pointer;
      this.blockPointers[idx] = BlockPointer;
      return null;
    }

    // Insert into all three parallel arrays
    this.keys.splice(idx, 0, key);
    this.pointers.splice(idx, 0, pointer);
    this.blockPointers.splice(idx, 0, BlockPointer);

    if (this.keys.length > this.order)
    {
      return this._splitSelf();
    }
    return null;
  }

  _splitSelf()
  {
    const mid = Math.floor(this.keys.length / 2);
    const right = new LeafNode(this.order);

    // Split all three parallel arrays
    right.keys = this.keys.splice(mid);
    right.pointers = this.pointers.splice(mid);
    right.blockPointers = this.blockPointers.splice(mid);

    right.next = this.next;
    this.next = right;

    const newKey = right.keys[0];
    return { newKey, newNode: right };
  }

  delete(key)
  {
    const idx = this._findInsertionIndex(key);

    // Key not found
    if (idx >= this.keys.length || this.keys[idx] !== key)
    {
      return undefined;
    }

    const deletedKey = this.keys[idx];
    const pointer = this.blockPointers[idx];

    // Remove from all three parallel arrays
    this.keys.splice(idx, 1);
    this.pointers.splice(idx, 1);
    this.blockPointers.splice(idx, 1);

    const minKeys = Math.ceil(this.order / 2);
    const needsMerge = this.keys.length < minKeys;

    return { deletedKey, pointer, needsMerge };
  }

  merge(parent, siblingIdx, childIdx)
  {
    const sibling = parent.children[siblingIdx];
    const isRightSibling = siblingIdx > childIdx;
    const parentKeyIdx = isRightSibling ? childIdx : siblingIdx;

    if (isRightSibling)
    {
      // Merge right sibling into this
      this.keys.push(...sibling.keys);
      this.pointers.push(...sibling.pointers);
      this.blockPointers.push(...sibling.blockPointers);
      this.next = sibling.next;
    }
    else
    {
      // Merge this into left sibling
      sibling.keys.push(...this.keys);
      sibling.pointers.push(...this.pointers);
      sibling.blockPointers.push(...this.blockPointers);
      sibling.next = this.next;
    }

    parent.keys.splice(parentKeyIdx, 1);
    parent.children.splice(siblingIdx, 1);
  }

  borrowFromSibling(parent, siblingIdx, childIdx)
  {
    const sibling = parent.children[siblingIdx];

    if (siblingIdx < childIdx)
    {
      // Borrow from left
      const siblingKey = sibling.keys.pop();
      const siblingPointer = sibling.pointers.pop();
      const siblingBlockPointer = sibling.blockPointers.pop();

      this.keys.unshift(siblingKey);
      this.pointers.unshift(siblingPointer);
      this.blockPointers.unshift(siblingBlockPointer);

      parent.keys[siblingIdx] = this.keys[0];
    }
    else
    {
      // Borrow from right
      const siblingKey = sibling.keys.shift();
      const siblingPointer = sibling.pointers.shift();
      const siblingBlockPointer = sibling.blockPointers.shift();

      this.keys.push(siblingKey);
      this.pointers.push(siblingPointer);
      this.blockPointers.push(siblingBlockPointer);

      parent.keys[childIdx] = sibling.keys[0];
    }
  }

  search(key)
  {
    const idx = this._findInsertionIndex(key);
    if (idx < this.keys.length && this.keys[idx] === key)
    {
      return this.blockPointers[idx]; // Return block pointer
    }
    return null;
  }

  _findInsertionIndex(key)
  {
    let low = 0;
    let high = this.keys.length;
    let mid;

    while (low < high)
    {
      mid = Math.floor((low + high) / 2);
      if (this.keys[mid] < key)
      {
        low = mid + 1;
      }
      else
      {
        high = mid;
      }
    }
    return low;
  }
}