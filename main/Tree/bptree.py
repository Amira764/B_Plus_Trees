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
        pass

    # -------------------------
    # Utilities / Traversal
    # -------------------------
    def get_last_steps(self) -> List[Any]:
        pass

    def traverse(self) -> List[List[Union[LeafNode, InternalNode]]]:
        """
        Return tree as list of levels (each level: list of nodes),
        useful for UI drawing.
        """
        pass

    def _find_leaf(self, key: Any) -> LeafNode:
        """Descend the tree to find the leaf node where `key` should be."""
        pass

    # -------------------------
    # Search
    # -------------------------
    def search(self, key: Any) -> Union[Optional[Any], List[Any]]:
        """
        Search for key.
        - UNIQUE mode: return the single value or None if not found
        - NON_UNIQUE mode: return list of values (empty list if none)
        """
        pass

    # -------------------------
    # Insert
    # -------------------------
    def insert(self, key: Any, value: Optional[Any] = None) -> List[Any]:
        """
        Insert (key, value) into the tree.
        Returns list of Step objects describing operation (for UI).
        """
        pass

    def _split_leaf(self, leaf: LeafNode):
        """
        Split a leaf node into two nodes and update parent.
        Promotion rule: promote first key of right node (B+ classic).
        This function records Steps (SplitLeafStep) and may call _split_internal.
        """
        pass

    def _split_internal(self, node: InternalNode):
        """
        Split internal node and promote middle key to parent.
        Promotion rule: middle key = first key of right node (as we keep consistency).
        Steps are recorded.
        """
        pass

    # -------------------------
    # Delete
    # -------------------------
    def delete(self, key: Any) -> List[Any]:
        """
        Placeholder for deletion implementation.
        Currently does nothing and returns an empty step list.
        Monmon will implement deletion steps (borrow/merge).
        """
    pass
