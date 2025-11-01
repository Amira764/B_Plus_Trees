import { LeafNode } from './LeafNode.js';

/**
 * Represents an Internal Node in the B+ Tree.
 * Internal nodes store keys to guide the search and pointers to child nodes.
 */
export class InternalNode {
  constructor(order) {
    this.order = order; // p = max number of pointers (children)
    this.keys = [];     // can have at most (p-1) keys
    this.children = [];
  }

  /**
   * Inserts a key-pointer pair into the subtree rooted at this node.
   * @param {number} key - The key to insert.
   * @param {*} pointer - The data pointer associated with the key.
   * @returns {object|null} - An object with {newKey, newNode} if a split occurred, otherwise null.
   */
  insert(key, pointer, BlockPointer) {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    
    // Recursively call insert on the appropriate child and forward BlockPointer
    const result = this.children[idx].insert(key, pointer, BlockPointer);

    // If the child split, we need to add the new key and child
    if (result) {
      const { newKey, newNode } = result;
      this.keys.splice(idx, 0, newKey);
      this.children.splice(idx + 1, 0, newNode);
    }

    // Split this node if it overflows
    if (this.children.length > this.order) {
      const mid = Math.floor(this.keys.length / 2);
      const newKey = this.keys[mid]; // Key to promote
      const right = new InternalNode(this.order);

      right.keys = this.keys.splice(mid + 1);
      right.children = this.children.splice(mid + 1);
      this.keys.splice(mid); // Remove promoted key and keys to the right

      return { newKey, newNode: right };
    }
    return null;
  }

/**
   * Deletes a key from the subtree rooted at this node.
   * @param {number} key - The key to delete.
   * @returns {number|object|undefined} - The deleted key, an object {deletedKey, needsMerge}, or undefined if not found.
   */
  delete(key) {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    
    const result = this.children[idx].delete(key);
    if (result === undefined) return undefined;

    // Normalize result to extract deletedKey and pointer
    const deletedKey = result?.needsMerge ? result.deletedKey : (result.deletedKey ?? result);
    const pointer = result?.pointer ?? undefined;

    // =================================================================
    // *** FIX: The order of these two blocks has been swapped. ***
    // We MUST rebalance the child (merge/borrow) *before*
    // we try to find a replacement key.
    // =================================================================

    // 1. HANDLE CHILD UNDERFLOW (MERGE/BORROW) - This must run FIRST
  if (result?.needsMerge) {
  const child = this.children[idx];
      
      const isLeaf = child instanceof LeafNode;
      const minSize = Math.ceil(child.order / 2);
      const currentSize = isLeaf ? child.keys.length : child.children.length;

  if (currentSize < minSize) {
        let borrowed = false;
        
        // Try to borrow from right sibling
        if (idx < this.children.length - 1) {
          const rightSibling = this.children[idx + 1];
          const siblingSize = isLeaf ? rightSibling.keys.length : rightSibling.children.length;
          if (siblingSize > minSize) {
            child.borrowFromSibling(this, idx + 1, idx);
            borrowed = true;
          }
        }
        
        // Try to borrow from left sibling
        if (!borrowed && idx > 0) {
          const leftSibling = this.children[idx - 1];
          const siblingSize = isLeaf ? leftSibling.keys.length : leftSibling.children.length;
          if (siblingSize > minSize) {
            child.borrowFromSibling(this, idx - 1, idx);
            borrowed = true;
          }
        }
        
        // If borrowing failed, merge
  if (!borrowed) {
          if (idx < this.children.length - 1) {
            // Merge with right sibling
            child.merge(this, idx + 1, idx);
          } else if (idx > 0) {
            // Merge with left sibling
            child.merge(this, idx - 1, idx);
          }
        }
      }
    }

    // 2. UPDATE INTERNAL KEYS - This runs SECOND, on the *balanced* tree
    // If a key was deleted, we might need to update our own keys
  if (deletedKey !== undefined) {
  const keyIdx = this.keys.indexOf(deletedKey);
      if (keyIdx !== -1) {
        // If we find the deleted key, replace it with the smallest key from its right subtree
        if (keyIdx + 1 < this.children.length) {
          // Now this call is safe, as the children are balanced
          const smallestKey = this.findSmallestKey(this.children[keyIdx + 1]);
          console.log("Replacing key", this.keys[keyIdx], "with smallest key from right subtree:", smallestKey);
          
          // Check if smallestKey is still valid (it might be undefined if the right child merged and became empty, e.g. root)
          if (smallestKey !== undefined) {
             this.keys[keyIdx] = smallestKey;
          } else {
             // This case can happen if the right child was merged *away*
             this.keys.splice(keyIdx, 1);
          }
         
        } else {
          // If no right subtree, just remove the key
          this.keys.splice(keyIdx, 1);
        }
      }
    }

    // 3. CHECK FOR SELF-UNDERFLOW
    // Check if this node itself is now underflowing
    const minChildren = Math.ceil(this.order / 2);
    if (this.children.length < minChildren) {
      return { deletedKey, pointer, needsMerge: true };
    }

    return { deletedKey, pointer };
  }

  /**
   * Merges this node with a sibling node.
   * @param {InternalNode} parent - The parent node.
   * @param {number} siblingIdx - The index of the sibling in the parent's children array.
   * @param {number} childIdx - The index of this node in the parent's children array.
   */
  merge(parent, siblingIdx, childIdx) {
    const sibling = parent.children[siblingIdx];
    const isRightSibling = siblingIdx > childIdx;
    
    // The key from the parent that separates these two nodes
    const parentKeyIdx = isRightSibling ? childIdx : siblingIdx;
    const parentKey = parent.keys[parentKeyIdx];

    if (isRightSibling) {
      // Merge right sibling (sibling) into this node (this)
      this.keys.push(parentKey, ...sibling.keys);
      this.children.push(...sibling.children);
      
      // Remove parent key and right sibling
      parent.keys.splice(parentKeyIdx, 1);
      parent.children.splice(siblingIdx, 1);
    } else {
      // Merge this node (this) into left sibling (sibling)
      sibling.keys.push(parentKey, ...this.keys);
      sibling.children.push(...this.children);
      
      // Remove parent key and this node
      parent.keys.splice(parentKeyIdx, 1);
      parent.children.splice(childIdx, 1);
    }
  }

  /**
   * Finds the smallest key in the subtree rooted at the given node.
   * @param {InternalNode|LeafNode} node - The node to start the search from.
   * @returns {number} - The smallest key.
   */
  findSmallestKey(node)
  {
    // If the node itself is invalid (e.g., merged away), return undefined
    if (!node) {
      return undefined;
    }
    
    // Keep traversing to the leftmost child until a leaf is reached
    while (node && !(node instanceof LeafNode))
    {
      node = node.children[0];
    }
    
    // If node is a valid leaf, return its first key.
    // If it's an empty leaf (which *shouldn't* happen if logic is correct, but as a safeguard), it will return undefined.
    return node?.keys[0]; // The smallest key is the first key in the leftmost leaf
  }

  /**
   * Borrows a key and child from a sibling node.
   * @param {InternalNode} parent - The parent node.
   * @param {number} siblingIdx - The index of the sibling in the parent's children array.
   * @param {number} childIdx - The index of this node in the parent's children array.
   */
  borrowFromSibling(parent, siblingIdx, childIdx) {
    const sibling = parent.children[siblingIdx];
    
    if (siblingIdx < childIdx) {
      // Sibling is on the left
      const siblingKey = sibling.keys.pop();
      const siblingChild = sibling.children.pop();
      const parentKey = parent.keys[siblingIdx]; // Parent key is at siblingIdx
      
      this.keys.unshift(parentKey);
      this.children.unshift(siblingChild);
      parent.keys[siblingIdx] = siblingKey; // New parent key is sibling's popped key
    } else {
      // Sibling is on the right
      const siblingKey = sibling.keys.shift();
      const siblingChild = sibling.children.shift();
      const parentKey = parent.keys[childIdx]; // Parent key is at childIdx
      
      this.keys.push(parentKey);
      this.children.push(siblingChild);
      parent.keys[childIdx] = siblingKey; // New parent key is sibling's shifted key
    }
  }

  /**
   * Searches for a key in the subtree rooted at this node.
   * @param {number} key - The key to search for.
   * @returns {*} - The data pointer if found, otherwise null.
   */
  search(key) {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx]) idx++;
    // Recursively call search on the appropriate child
    return this.children[idx].search(key);
  }
}
