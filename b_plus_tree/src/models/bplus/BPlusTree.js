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

	insert(key, pointer, BlockPointer)
	{
		const numericKey = Number(key);
		if (isNaN(numericKey))
		{
			throw new Error('Invalid key: must be a number');
		}

		const result = this.root.insert(numericKey, pointer, BlockPointer);

		if (result)
		{
			const { newKey, newNode } = result;
			const newRoot = new InternalNode(this.orderInternal);
			newRoot.keys = [newKey];
			newRoot.children = [this.root, newNode];
			this.root = newRoot;
		}
	}

	delete(key)
	{
		const numericKey = Number(key);
		if (isNaN(numericKey))
		{
			throw new Error('Invalid key: must be a number');
		}

		console.log("root type:", typeof (this.root));
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

		return { deletedKey, pointer };
	}
}