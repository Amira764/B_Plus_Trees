import { InternalNode } from './InternalNode.js';
import { LeafNode } from './LeafNode.js';

/**
 * Represents the B+ Tree structure.
 */
export class BPlusTree
{
  /**
   * Creates a new B+ Tree.
   * @param {number} [orderInternal=3] - The order (max children) for internal nodes.
   * @param {number} [orderLeaf=2] - The order (max keys) for leaf nodes.
   */
  constructor(orderInternal = 3, orderLeaf = 2)
  {
    this.orderInternal = orderInternal;
    this.orderLeaf = orderLeaf;
    this.root = new LeafNode(orderLeaf);
  }

  /**
   * Inserts a key-pointer pair into the tree.
   * @param {number|string} key - The key to insert.
   * @param {*} pointer - The data pointer to associate with the key.
   */
  insert(key, pointer, BlockPointer)
  {
    const numericKey = Number(key);
    if (isNaN(numericKey))
    {
      throw new Error('Invalid key: must be a number');
    }
    
    // Insert into the root
    const result = this.root.insert(numericKey, pointer, BlockPointer);
    
    // If the root split, create a new root
    if (result)
    {
      const { newKey, newNode } = result;
      const newRoot = new InternalNode(this.orderInternal);
      newRoot.keys = [newKey];
      newRoot.children = [this.root, newNode];
      this.root = newRoot;
    }
  }

  /**
   * Deletes a key from the tree.
   * @param {number|string} key - The key to delete.
   * @returns {*} - The deleted key if found, otherwise undefined.
   */
  delete(key)
  {
    const numericKey = Number(key);
    if (isNaN(numericKey))
    {
      throw new Error('Invalid key: must be a number');
    }
    
    console.log("root type:", typeof(this.root));
    const result = this.root.delete(numericKey);
    if (result === undefined) return undefined;

    const deletedKey = result?.needsMerge ? result.deletedKey : (result.deletedKey ?? result);
    const pointer = result?.pointer ?? undefined;
    
    // Handle root shrinkage
    if (this.root instanceof InternalNode)
    {
      // If root has only one child, make that child the new root
      if (this.root.children.length === 1)
      {
        this.root = this.root.children[0];
      }
      // If root is empty (but not a leaf), make its first child the new root
      else if (this.root.keys.length === 0 && !(this.root instanceof LeafNode))
      {
        this.root = this.root.children[0];
      }
    }
    else if (this.root instanceof LeafNode)
    {
      // If root is an empty leaf, reset the tree
      if (this.root.keys.length === 0)
      {
        this.root = new LeafNode(this.orderLeaf);
      }
    }
    
    // Return both the deleted key and the pointer (if available)
    return { deletedKey, pointer };
  }

  /**
   * Searches for a key in the tree.
   * @param {number|string} key - The key to search for.
   * @returns {*} - The data pointer associated with the key, or null if not found.
   */
  search(key)
  {
    const numericKey = Number(key);
    if (isNaN(numericKey))
    {
      throw new Error('Invalid key: must be a number');
    }
    return this.root.search(numericKey);
  }

  /* ==========================================================
   * VISUALIZATION FUNCTIONS
   * ========================================================== */

  /**
   * Logs a level-by-level visualization of the tree to the console.
   */
  visualize()
  {
    console.log("\n🌳 B+ TREE VISUALIZATION");
    const levels = [];
    this._collect_levels(this.root, 0, levels);

    for (let i = 0; i < levels.length; i++)
    {
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

  /**
   * Helper function for visualize() to collect nodes by level.
   * @private
   */
  _collect_levels(node, level, levels)
  {
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);

    if (node instanceof InternalNode)
    {
      for (const child of node.children)
      {
        this._collect_levels(child, level + 1, levels);
      }
    }
  }

  /**
   * Logs an indented tree structure to the console.
   * @param {InternalNode|LeafNode} [node=this.root] - The node to start printing from.
   * @param {number} [level=0] - The current indentation level.
   */
  print(node = this.root, level = 0)
  {
    const indent = "  ".repeat(level);
    if (node instanceof LeafNode)
    {
      console.log(`${indent}Leaf → [${node.keys.join(", ")}]`);
    }
    else
    {
      console.log(`${indent}Internal → [${node.keys.join(", ")}]`);
      for (const child of node.children) this.print(child, level + 1);
    }
  }
}
