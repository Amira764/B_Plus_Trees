# Tree/bptree.py
"""
B+ Tree implementation (insertion + search).
Deletion functions are defined but intentionally left as placeholders (pass)
so Monmon can implement them later.

Features:
- Flexible orders: order_internal (P) and order_leaf (pleaf)
- Supports UNIQUE (no duplicates) and NON_UNIQUE modes
- Emits Step objects for UI animation (InsertLeafStep, SplitLeafStep, SplitInternalStep, NewRootStep)
- Proper error handling and validation
- Leaf doubly-linked list maintained (prev_leaf, next_leaf)
- Values stored in leaves (value_mode), can be None or user-provided
"""

from typing import Any, List, Optional, Union, Tuple

from Tree.node import LeafNode, InternalNode
from Tree.enums import ValueMode
from Tree.steps import (
    InsertLeafStep,
    SplitLeafStep,
    SplitInternalStep,
    NewRootStep,
)

# Custom Exceptions
class BPlusTreeError(Exception):
    pass

class DuplicateKeyError(BPlusTreeError):
    pass

class InvalidOrderError(BPlusTreeError):
    pass


class BPlusTree:
    def __init__(
        self,
        order_internal: int = 3,
        order_leaf: int = 2,
        unique: bool = True,
        value_mode: ValueMode = ValueMode.KEY_ONLY,
    ):
        """
        :param order_internal: P (max children in internal node). Default 3.
        :param order_leaf: pleaf (max keys in leaf). Default 2.
        :param unique: if True, duplicate keys are rejected.
        :param value_mode: ValueMode enum (KEY_ONLY, BLOCK_PTR, RECORD_OBJ).
        """
        # Basic validation
        if order_internal < 3:
            raise InvalidOrderError("order_internal must be >= 3")
        if order_leaf < 1:
            raise InvalidOrderError("order_leaf must be >= 1")

        self.order_internal = order_internal
        self.order_leaf = order_leaf
        self.unique = unique
        self.value_mode = value_mode

        # Initially root is an empty leaf
        self.root: Union[LeafNode, InternalNode] = LeafNode(value_mode=self.value_mode)
        self._last_steps: List[Any] = []

    # -------------------------
    # Utilities / Traversal
    # -------------------------
    def get_last_steps(self) -> List[Any]:
        return list(self._last_steps)

    def traverse(self) -> List[List[Union[LeafNode, InternalNode]]]:
        """
        Return tree as list of levels (each level: list of nodes),
        useful for UI drawing.
        """
        levels: List[List[Union[LeafNode, InternalNode]]] = []
        q: List[Tuple[Union[LeafNode, InternalNode], int]] = [(self.root, 0)]
        while q:
            node, lvl = q.pop(0)
            if len(levels) <= lvl:
                levels.append([])
            levels[lvl].append(node)
            if isinstance(node, InternalNode):
                for c in node.children:
                    q.append((c, lvl + 1))
        return levels

    def _find_leaf(self, key: Any) -> LeafNode:
        """Descend the tree to find the leaf node where `key` should be."""
        node = self.root
        while isinstance(node, InternalNode):
            # find the child index
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            # i is the child index to follow
            node = node.children[i]
        # node is a LeafNode
        return node

    # -------------------------
    # Search
    # -------------------------
    def search(self, key: Any) -> Union[Optional[Any], List[Any]]:
        """
        Search for key.
        - UNIQUE mode: return the single value or None if not found
        - NON_UNIQUE mode: return list of values (empty list if none)
        """
        if self.root is None:
            return None if self.unique else []

        leaf = self._find_leaf(key)
        # collect all matches in that leaf (and maybe subsequent leaves if duplicates span leaves)
        results = []
        for i, k in enumerate(leaf.keys):
            if k == key:
                results.append(leaf.values[i])

        if not results:
            # no match in this leaf; it's possible duplicates are in next leaf if split happened,
            # but because we keep duplicates together and splitting uses the first key of right as promoted,
            # duplicates for a given key will always be in contiguous leaves starting where the key would be found.
            # To be thorough, scan forward until first non-matching key.
            # Start from the leaf we found:
            nxt = leaf.next_leaf
            while nxt:
                for i, k in enumerate(nxt.keys):
                    if k == key:
                        results.append(nxt.values[i])
                    else:
                        # if first key > key then stop scanning (since leaves are sorted)
                        if k > key:
                            nxt = None
                            break
                        # otherwise continue (could be rare ordering case)
                if nxt:
                    nxt = nxt.next_leaf

        if self.unique:
            return results[0] if results else None
        else:
            return results

    # -------------------------
    # Insert
    # -------------------------
    def insert(self, key: Any, value: Optional[Any] = None) -> List[Any]:
        """
        Insert (key, value) into the tree.
        Returns list of Step objects describing operation (for UI).
        """
        # reset steps for this operation
        self._last_steps = []

        if value is None:
            # default behavior: keep None if not supplied (KEY_ONLY)
            value_to_store = None
        else:
            value_to_store = value

        # find target leaf
        leaf = self._find_leaf(key)

        # if UNIQUE and key exists in tree -> raise
        if self.unique:
            # quick check in leaf; duplicates should be localized
            if key in leaf.keys:
                raise DuplicateKeyError(f"Key {key} already exists in UNIQUE index")

        # Determine insertion index (stable position)
        insert_idx = 0
        while insert_idx < len(leaf.keys) and leaf.keys[insert_idx] <= key:
            # For NON_UNIQUE we want equal keys to be appended after existing ones
            # For UNIQUE we already blocked duplicates above
            insert_idx += 1

        # Capture before state
        before_keys = list(leaf.keys)

        # Insert key and value
        leaf.keys.insert(insert_idx, key)
        # ensure values list aligned
        leaf.values.insert(insert_idx, value_to_store)

        # Record insert step
        self._last_steps.append(
            InsertLeafStep(leaf, key, insert_idx, before=before_keys, after=list(leaf.keys))
        )

        # If overflow, split
        if leaf.is_full(self.order_leaf):
            self._split_leaf(leaf)

        return self.get_last_steps()

    def _split_leaf(self, leaf: LeafNode):
        """
        Split a leaf node into two nodes and update parent.
        Promotion rule: promote first key of right node (B+ classic).
        This function records Steps (SplitLeafStep) and may call _split_internal.
        """
        # store before
        before = list(leaf.keys)

        # create new right leaf
        right = LeafNode(value_mode=self.value_mode)

        # determine split index:
        # We want right to have equal or more keys (assignment rule).
        # For N keys (N = current count), choose mid = floor(N/2)
        N = len(leaf.keys)
        mid = N // 2  # floor division
        # left keeps keys[:mid], right gets keys[mid:]
        left_keys = leaf.keys[:mid]
        right_keys = leaf.keys[mid:]

        left_values = leaf.values[:mid]
        right_values = leaf.values[mid:]

        # assign to nodes
        leaf.keys = left_keys
        leaf.values = left_values

        right.keys = right_keys
        right.values = right_values

        # fix leaf links (doubly-linked)
        right.next_leaf = leaf.next_leaf
        if right.next_leaf:
            right.next_leaf.prev_leaf = right
        leaf.next_leaf = right
        right.prev_leaf = leaf

        # set parents
        parent = leaf.parent
        right.parent = parent

        # promoted key is first key of right (per B+ classic)
        promoted_key = right.keys[0]

        # record step
        self._last_steps.append(
            SplitLeafStep(
                old_leaf=leaf,
                new_leaf=right,
                promoted_key=promoted_key,
                before=before,
                left_after=list(leaf.keys),
                right_after=list(right.keys),
            )
        )

        # Insert promoted key into parent (create parent if needed)
        if parent is None:
            # create a new root
            new_root = InternalNode()
            new_root.keys = [promoted_key]
            new_root.children = [leaf, right]
            leaf.parent = new_root
            right.parent = new_root
            self.root = new_root
            self._last_steps.append(NewRootStep(old_root=None, new_root=new_root))
            return

        # otherwise insert right into parent's children list after leaf
        insert_pos = parent.children.index(leaf) + 1
        parent.children.insert(insert_pos, right)
        parent.keys.insert(insert_pos - 1, promoted_key)
        right.parent = parent

        # if parent's children overflow, split internal
        if parent.is_full(self.order_internal):
            self._split_internal(parent)

    def _split_internal(self, node: InternalNode):
        """
        Split internal node and promote middle key to parent.
        Promotion rule: middle key = first key of right node (as we keep consistency).
        Steps are recorded.
        """
        before = list(node.keys)

        # number of children
        C = len(node.children)
        # mid index per spec: floor((#nodes + 1) / 2)
        mid_index = (C + 1) // 2

        # create right internal node
        right = InternalNode()

        # move children and keys to right
        right.children = node.children[mid_index:]
        # update children's parent pointer
        for c in right.children:
            c.parent = right

        # keys to right are node.keys[mid_index:]
        right.keys = node.keys[mid_index:]

        # left keeps children[:mid_index], keys[:mid_index]
        left_children = node.children[:mid_index]
        left_keys = node.keys[:mid_index]

        node.children = left_children
        node.keys = left_keys

        # promoted key — choose first key of right (if exists)
        promoted_key = right.keys[0] if right.keys else None

        # record step
        self._last_steps.append(
            SplitInternalStep(
                old_node=node,
                new_node=right,
                promoted_key=promoted_key,
                before=before,
                left_after=list(node.keys),
                right_after=list(right.keys),
            )
        )

        parent = node.parent
        right.parent = parent

        if parent is None:
            # new root
            new_root = InternalNode()
            # if promoted_key is None (rare), use right.keys[0] guard
            key_to_promote = promoted_key if promoted_key is not None else (right.keys[0] if right.keys else None)
            if key_to_promote is None:
                # degenerate case: shouldn't happen unless tree is malformed
                raise BPlusTreeError("Promotion key is None during internal split")
            new_root.keys = [key_to_promote]
            new_root.children = [node, right]
            node.parent = new_root
            right.parent = new_root
            self.root = new_root
            self._last_steps.append(NewRootStep(old_root=None, new_root=new_root))
            return

        # insert right into parent after node
        insert_pos = parent.children.index(node) + 1
        parent.children.insert(insert_pos, right)
        # Insert promoted key into parent's keys at insert_pos - 1
        key_insert_pos = insert_pos - 1
        key_to_insert = promoted_key if promoted_key is not None else (right.keys[0] if right.keys else None)
        parent.keys.insert(key_insert_pos, key_to_insert)

        # If parent now overflows, recursively split
        if parent.is_full(self.order_internal):
            self._split_internal(parent)

    # -------------------------
    # Deletion placeholders (Monmon will implement)
    # -------------------------
    def delete(self, key: Any) -> List[Any]:
        """
        Placeholder for deletion implementation.
        Currently does nothing and returns an empty step list.
        Monmon will implement deletion steps (borrow/merge).
        """
        # keep API consistent
        self._last_steps = []
        # deletion intentionally unimplemented (placeholder)
        # In future: implement borrowing, merging, updating parent keys, shrinking root
        return self.get_last_steps()
