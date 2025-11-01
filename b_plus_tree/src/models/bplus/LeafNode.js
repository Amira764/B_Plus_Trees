export class LeafNode
{
	constructor(order)
	{
		this.order = order;
		this.keys = [];
		this.pointers = [];
		this.next = null;
		this.blockPointers = [];
	}

	insert(key, pointer, BlockPointer)
	{
		let idx = 0;
		while (idx < this.keys.length && key > this.keys[idx]) idx++;

		if (this.keys[idx] === key)
		{
			this.pointers[idx] = pointer;
			this.blockPointers[idx] = BlockPointer;
			return null;
		}

		this.keys.splice(idx, 0, key);
		this.pointers.splice(idx, 0, pointer);
		this.blockPointers.splice(idx, 0, BlockPointer);

		if (this.keys.length > this.order)
		{
			const mid = Math.floor(this.keys.length / 2);
			const right = new LeafNode(this.order);

			right.keys = this.keys.splice(mid);
			right.pointers = this.pointers.splice(mid);
			right.blockPointers = this.blockPointers.splice(mid);

			right.next = this.next;
			this.next = right;

			const newKey = right.keys[0];
			return { newKey, newNode: right };
		}
		return null;
	}

	delete(key)
	{
		console.log("LeafNode.delete called with key:", key);
		const idx = this.keys.findIndex(k => k === key);
		if (idx === -1) return undefined;

		const deletedKey = this.keys[idx];
		const pointer = this.blockPointers[idx];

		this.keys.splice(idx, 1);
		this.pointers.splice(idx, 1);
		this.blockPointers.splice(idx, 1);

		const minKeys = Math.ceil(this.order / 2);
		if (this.keys.length < minKeys)
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

		if (isRightSibling)
		{
			this.keys.push(...sibling.keys);
			this.pointers.push(...sibling.pointers);
			this.blockPointers.push(...sibling.blockPointers);
			this.next = sibling.next;

			parent.keys.splice(parentKeyIdx, 1);
			parent.children.splice(siblingIdx, 1);
		}
		else
		{
			sibling.keys.push(...this.keys);
			sibling.pointers.push(...this.pointers);
			sibling.blockPointers.push(...this.blockPointers);
			sibling.next = this.next;

			parent.keys.splice(parentKeyIdx, 1);
			parent.children.splice(childIdx, 1);
		}
	}

	borrowFromSibling(parent, siblingIdx, childIdx)
	{
		const sibling = parent.children[siblingIdx];

		if (siblingIdx < childIdx)
		{
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
		const idx = this.keys.indexOf(key);
		return idx !== -1 ? this.pointers[idx] : null;
	}
}