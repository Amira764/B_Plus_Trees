// LeafNode.js

/**
 * Represents a Leaf Node in the B+ Tree.
 * Leaf nodes store the actual keys and data pointers.
 */
export class LeafNode
{
  constructor(order)
  {
    this.order = order; // p_leaf = max number of data pointers
    this.keys = [];     // can have at most p_leaf keys
    this.pointers = []; // Stores originalLineNumber
    this.next = null;   // Pointer to the next leaf node
    // FIX: Changed from a single value to an array
    this.blockPointers = []; // Stores { blockId, recordIndex }
  }

  /**
   * Inserts a key-pointer pair into the leaf node.
   * @param {number} key - The key to insert.
   * @param {*} pointer - The data pointer associated with the key (originalLineNumber).
   * @param {object} BlockPointer - The { blockId, recordIndex } pointer.
   * @returns {object|null} - An object with {newKey, newNode} if a split occurred, otherwise null.
   */
  insert(key, pointer, BlockPointer)
  {
    let idx = 0;
    while (idx < this.keys.length && key > this.keys[idx]) idx++;

    // Update if key already exists
    if (this.keys[idx] === key)
    {
      this.pointers[idx] = pointer;
      // FIX: Update the block pointer as well
      this.blockPointers[idx] = BlockPointer;
      return null;
    }
    
    // FIX: Insert into all three parallel arrays
    this.keys.splice(idx, 0, key);
    this.pointers.splice(idx, 0, pointer);
    this.blockPointers.splice(idx, 0, BlockPointer);

    // Split when keys exceed order
    if (this.keys.length > this.order)
    {
      const mid = Math.floor(this.keys.length / 2);
      const right = new LeafNode(this.order);
      
      // Split keys and pointers
      right.keys = this.keys.splice(mid);
      right.pointers = this.pointers.splice(mid);
      // FIX: Split the block pointers array
      right.blockPointers = this.blockPointers.splice(mid);
      
      // Maintain linked list of leaves
      right.next = this.next;
      this.next = right;

      // Smallest key in right node goes up
      const newKey = right.keys[0];
      return { newKey, newNode: right };
    }
    return null;
  }

  /**
   * Deletes a key from the leaf node.
   * @param {number} key - The key to delete.
   * @returns {object|undefined} - An object {deletedKey, pointer, needsMerge?} or undefined if not found.
   */
  delete(key)
  {
    console.log("LeafNode.delete called with key:", key);
    const idx = this.keys.findIndex(k => k === key);
    if (idx === -1) return undefined; // Key not found

    const deletedKey = this.keys[idx];
    // FIX: Get the specific block pointer for this key
    const pointer = this.blockPointers[idx];

    // Remove key and pointers from all arrays
    this.keys.splice(idx, 1);
    this.pointers.splice(idx, 1);
    // FIX: Remove from the block pointers array
    this.blockPointers.splice(idx, 1);

    // Check if node needs to be merged
    const minKeys = Math.ceil(this.order / 2);
    if (this.keys.length < minKeys)
    {
      return { deletedKey, pointer, needsMerge: true };
    }

    // Return deletedKey and pointer so callers can act on the underlying block immediately
    return { deletedKey, pointer };
  }

  /**
   * Merges this node with a sibling node.
   * @param {InternalNode} parent - The parent node.
   * @param {number} siblingIdx - The index of the sibling in the parent's children array.
   * @param {number} childIdx - The index of this node in the parent's children array.
   */
  merge(parent, siblingIdx, childIdx)
  {
    const sibling = parent.children[siblingIdx];
    const isRightSibling = siblingIdx > childIdx;
    
    // The key from the parent that separates these two nodes
    const parentKeyIdx = isRightSibling ? childIdx : siblingIdx;

    if (isRightSibling)
    {
      // Merge right sibling (sibling) into this node (this)
      this.keys.push(...sibling.keys);
      this.pointers.push(...sibling.pointers);
      // FIX: Merge block pointers
      this.blockPointers.push(...sibling.blockPointers);
      this.next = sibling.next;
      
      // Remove parent key and right sibling
      parent.keys.splice(parentKeyIdx, 1);
      parent.children.splice(siblingIdx, 1);
    }
    else
    {
      // Merge this node (this) into left sibling (sibling)
      sibling.keys.push(...this.keys);
      sibling.pointers.push(...this.pointers);
      // FIX: Merge block pointers
      sibling.blockPointers.push(...this.blockPointers);
      sibling.next = this.next;
      
      // Remove parent key and this node
      parent.keys.splice(parentKeyIdx, 1);
      parent.children.splice(childIdx, 1);
    }
  }

  /**
   * Borrows a key-pointer pair from a sibling node.
   * @param {InternalNode} parent - The parent node.
   * @param {number} siblingIdx - The index of the sibling in the parent's children array.
   * @param {number} childIdx - The index of this node in the parent's children array.
   */
  borrowFromSibling(parent, siblingIdx, childIdx)
  {
    const sibling = parent.children[siblingIdx];
    
    if (siblingIdx < childIdx)
    {
      // Sibling is on the left
      const siblingKey = sibling.keys.pop();
      const siblingPointer = sibling.pointers.pop();
      // FIX: Get block pointer
      const siblingBlockPointer = sibling.blockPointers.pop();
      this.keys.unshift(siblingKey);
      this.pointers.unshift(siblingPointer);
      // FIX: Add block pointer
      this.blockPointers.unshift(siblingBlockPointer);
      
      // Update parent key (which is at index childIdx - 1, or siblingIdx)
      parent.keys[siblingIdx] = this.keys[0]; // New separator is first key of current node
    }
    else
    {
      // Sibling is on the right
      const siblingKey = sibling.keys.shift();
      const siblingPointer = sibling.pointers.shift();
      // FIX: Get block pointer
      const siblingBlockPointer = sibling.blockPointers.shift();
      this.keys.push(siblingKey);
      this.pointers.push(siblingPointer);
      // FIX: Add block pointer
      this.blockPointers.push(siblingBlockPointer);
      
      // Update parent key (which is at index childIdx)
      parent.keys[childIdx] = sibling.keys[0]; // New separator is first key of right sibling
    }
  }

  /**
   * Searches for a key in the leaf node.
   * @param {number} key - The key to search for.
   * @returns {*} - The data pointer if found, otherwise null.
   */
  search(key)
  {
    const idx = this.keys.indexOf(key);
    return idx !== -1 ? this.pointers[idx] : null;
  }
}