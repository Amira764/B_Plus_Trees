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
		let idx = 0;
		while (idx < this.keys.length && key >= this.keys[idx]) idx++;

		const result = this.children[idx].insert(key, pointer, BlockPointer);

		if (result)
		{
			const { newKey, newNode } = result;
			this.keys.splice(idx, 0, newKey);
			this.children.splice(idx + 1, 0, newNode);
		}

		if (this.children.length > this.order)
		{
			const mid = Math.floor(this.keys.length / 2);
			const newKey = this.keys[mid];
			const right = new InternalNode(this.order);

			right.keys = this.keys.splice(mid + 1);
			right.children = this.children.splice(mid + 1);
			this.keys.splice(mid);

			return { newKey, newNode: right };
		}
		return null;
	}

	delete(key)
	{
		let idx = 0;
		while (idx < this.keys.length && key >= this.keys[idx]) idx++;

		const result = this.children[idx].delete(key);
		if (result === undefined) return undefined;

		const deletedKey = result?.needsMerge ? result.deletedKey : (result.deletedKey ?? result);
		const pointer = result?.pointer ?? undefined;

		// 1. HANDLE CHILD UNDERFLOW (MERGE/BORROW) - This must run FIRST
		if (result?.needsMerge)
		{
			const child = this.children[idx];

			const isLeaf = child instanceof LeafNode;
			const minSize = Math.ceil(child.order / 2);
			const currentSize = isLeaf ? child.keys.length : child.children.length;

			if (currentSize < minSize)
			{
				let borrowed = false;

				// Try to borrow from right sibling
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

				// Try to borrow from left sibling
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

				// If borrowing failed, merge
				if (!borrowed)
				{
					if (idx < this.children.length - 1)
					{
						// Merge with right sibling
						child.merge(this, idx + 1, idx);
					}
          else if (idx > 0)
					{
						// Merge with left sibling
						child.merge(this, idx - 1, idx);
					}
				}
			}
		}

		// 2. UPDATE INTERNAL KEYS - This runs SECOND, on the *balanced* tree
		if (deletedKey !== undefined)
		{
			const keyIdx = this.keys.indexOf(deletedKey);
			if (keyIdx !== -1)
			{
				if (keyIdx + 1 < this.children.length)
				{
					const smallestKey = this.findSmallestKey(this.children[keyIdx + 1]);
					console.log("Replacing key", this.keys[keyIdx], "with smallest key from right subtree:", smallestKey);

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
		}

		// 3. CHECK FOR SELF-UNDERFLOW
		const minChildren = Math.ceil(this.order / 2);
		if (this.children.length < minChildren)
		{
			return { deletedKey, pointer, needsMerge: true };
		}

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
			this.keys.push(parentKey, ...sibling.keys);
			this.children.push(...sibling.children);

			parent.keys.splice(parentKeyIdx, 1);
			parent.children.splice(siblingIdx, 1);
		}
		else
		{
			sibling.keys.push(parentKey, ...this.keys);
			sibling.children.push(...this.children);

			parent.keys.splice(parentKeyIdx, 1);
			parent.children.splice(childIdx, 1);
		}
	}

	findSmallestKey(node)
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

	borrowFromSibling(parent, siblingIdx, childIdx)
	{
		const sibling = parent.children[siblingIdx];

		if (siblingIdx < childIdx)
		{
			const siblingKey = sibling.keys.pop();
			const siblingChild = sibling.children.pop();
			const parentKey = parent.keys[siblingIdx];

			this.keys.unshift(parentKey);
			this.children.unshift(siblingChild);
			parent.keys[siblingIdx] = siblingKey;
		}
		else
		{
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
		let idx = 0;
		while (idx < this.keys.length && key >= this.keys[idx]) idx++;
		return this.children[idx].search(key);
	}
}