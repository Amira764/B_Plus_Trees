import { InternalNode } from './InternalNode.js';
import { LeafNode } from './LeafNode.js';


export class BPlusTree
{
  constructor(orderInternal = 3, orderLeaf = 2)
  {
    this.orderInternal = orderInternal;
    this.orderLeaf = orderLeaf;
    this.root = new LeafNode(orderLeaf);
  }

  _validateKey(key)
  {
    const numericKey = Number(key);
    if (isNaN(numericKey))
    {
      throw new Error('Invalid key: must be a number');
    }
    return numericKey;
  }

  insert(key, pointer, BlockPointer)
  {
    const numericKey = this._validateKey(key);
    const result = this.root.insert(numericKey, pointer, BlockPointer);
    if (result) // If the root split, create a new root
    {
      const { newKey, newNode } = result; //newKey is the key to be promoted, newNode is the new right node
      const newRoot = new InternalNode(this.orderInternal);
      newRoot.keys = [newKey];
      newRoot.children = [this.root, newNode];
      this.root = newRoot;
    }
  }

  delete(key)
  {
    const numericKey = this._validateKey(key);
    const result = this.root.delete(numericKey);
    if (result === undefined)
    {
      return undefined;
    }

    const deletedKey = (typeof result === 'object' && result !== null) ? result.deletedKey : result;
    const pointer = (typeof result === 'object' && result !== null) ? result.pointer : undefined;

    if (this.root instanceof InternalNode)
    { // Handle root shrinkage
      if (this.root.children.length === 1)
      { // If root has only one child, make that child the new root.
        this.root = this.root.children[0];
      }
      else if (this.root.keys.length === 0)
      { // If root is empty: deleted the root (but not a leaf), make its first child the new root.
        this.root = this.root.children[0];
      }
    }
    else if (this.root instanceof LeafNode)
    {
      if (this.root.keys.length === 0)
      { // If root is an empty leaf, reset the tree
        this.root = new LeafNode(this.orderLeaf);
      }
    }

    return { deletedKey, pointer };
  }
}