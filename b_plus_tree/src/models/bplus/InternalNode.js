import { LeafNode } from './LeafNode.js';

export class InternalNode
{
  constructor(order)
  {
    this.order = order;
    this.keys = [];
    this.children = [];
  }

  insert(key, pointer, BlockPointer)
  {
    const idx = this._findChildIndex(key);
    const result = this.children[idx].insert(key, pointer, BlockPointer);

    if (result)
    {
      const { newKey, newNode } = result;
      this.keys.splice(idx, 0, newKey);
      this.children.splice(idx + 1, 0, newNode);
    }

    if (this.children.length > this.order)
    {
      return this._splitSelf();
    }
    return null;
  }

  _splitSelf()
  {
    const mid = Math.floor(this.keys.length / 2);
    const newKey = this.keys[mid];
    const right = new InternalNode(this.order);

    right.keys = this.keys.splice(mid + 1);
    right.children = this.children.splice(mid + 1);
    this.keys.splice(mid);

    return { newKey, newNode: right };
  }

  delete(key)
  {
    const idx = this._findChildIndex(key);
    const result = this.children[idx].delete(key);

    if (result === undefined)
    {
      return undefined;
    }

    const { deletedKey, pointer } = this._normalizeDeleteResult(result);

    // Handle child underflow before updating internal keys
    if (result?.needsMerge)
    {
      this._handleChildUnderflow(this.children[idx], idx);
    }

    // Update internal keys on the balanced tree
    if (deletedKey !== undefined)
    {
      this._updateInternalKey(deletedKey);
    }

    // Check for self-underflow
    const minChildren = Math.ceil(this.order / 2);
    if (this.children.length < minChildren)
    {
      return { deletedKey, pointer, needsMerge: true };
    }

    return { deletedKey, pointer };
  }

  _handleChildUnderflow(child, idx)
  {
    const isLeaf = child instanceof LeafNode;
    const minSize = Math.ceil(child.order / 2);
    const currentSize = isLeaf ? child.keys.length : child.children.length;

    if (currentSize >= minSize)
    {
      return;
    }

    let borrowed = false;

    // Try borrow from right
    if (idx < this.children.length - 1)
    {
      const rightSibling = this.children[idx + 1];
      const siblingSize = isLeaf ? rightSibling.keys.length : rightSibling.children.length;
      if (siblingSize > minSize)
      {
        child.borrowFromSibling(this, idx + 1, idx);
        borrowed = true;
      }
    }

    // Try borrow from left
    if (!borrowed && idx > 0)
    {
      const leftSibling = this.children[idx - 1];
      const siblingSize = isLeaf ? leftSibling.keys.length : leftSibling.children.length;
      if (siblingSize > minSize)
      {
        child.borrowFromSibling(this, idx - 1, idx);
        borrowed = true;
      }
    }

    // Merge if borrowing failed
    if (!borrowed)
    {
      if (idx < this.children.length - 1)
      {
        child.merge(this, idx + 1, idx);
      } else if (idx > 0)
      {
        child.merge(this, idx - 1, idx);
      }
    }
  }

  _updateInternalKey(deletedKey)
  {
    const keyIdx = this.keys.indexOf(deletedKey);
    if (keyIdx === -1)
    {
      return;
    }

    if (keyIdx + 1 < this.children.length)
    {
      const smallestKey = this._findSmallestKey(this.children[keyIdx + 1]);

      if (smallestKey !== undefined)
      {
        this.keys[keyIdx] = smallestKey;
      }
      else
      {
        this.keys.splice(keyIdx, 1);
      }
    }
    else
    {
      this.keys.splice(keyIdx, 1);
    }
  }

  _normalizeDeleteResult(result)
  {
    const deletedKey = (typeof result === 'object' && result !== null) ? result.deletedKey : result;
    const pointer = (typeof result === 'object' && result !== null) ? result.pointer : undefined;
    return { deletedKey, pointer };
  }

  merge(parent, siblingIdx, childIdx)
  {
    const sibling = parent.children[siblingIdx];
    const isRightSibling = siblingIdx > childIdx;

    const parentKeyIdx = isRightSibling ? childIdx : siblingIdx;
    const parentKey = parent.keys[parentKeyIdx];

    if (isRightSibling)
    {
      // Merge right sibling into this
      this.keys.push(parentKey, ...sibling.keys);
      this.children.push(...sibling.children);
      parent.keys.splice(parentKeyIdx, 1);
      parent.children.splice(siblingIdx, 1);
    }
    else
    {
      // Merge this into left sibling
      sibling.keys.push(parentKey, ...this.keys);
      sibling.children.push(...this.children);
      parent.keys.splice(parentKeyIdx, 1);
      parent.children.splice(childIdx, 1);
    }
  }

  borrowFromSibling(parent, siblingIdx, childIdx)
  {
    const sibling = parent.children[siblingIdx];

    if (siblingIdx < childIdx)
    {
      // Sibling is on the left
      const siblingKey = sibling.keys.pop();
      const siblingChild = sibling.children.pop();
      const parentKey = parent.keys[siblingIdx];

      this.keys.unshift(parentKey);
      this.children.unshift(siblingChild);
      parent.keys[siblingIdx] = siblingKey;
    }
    else
    {
      // Sibling is on the right
      const siblingKey = sibling.keys.shift();
      const siblingChild = sibling.children.shift();
      const parentKey = parent.keys[childIdx];

      this.keys.push(parentKey);
      this.children.push(siblingChild);
      parent.keys[childIdx] = siblingKey;
    }
  }

  search(key)
  {
    const idx = this._findChildIndex(key);
    return this.children[idx].search(key);
  }

  _findChildIndex(key)
  {
    let idx = 0;
    while (idx < this.keys.length && key >= this.keys[idx])
    {
      idx++;
    }
    return idx;
  }

  _findSmallestKey(node)
  {
    if (!node)
    {
      return undefined;
    }
    while (node && !(node instanceof LeafNode))
    {
      node = node.children[0];
    }
    return node?.keys[0];
  }
}