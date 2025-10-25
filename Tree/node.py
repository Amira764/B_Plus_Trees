# Tree/node.py

from typing import List, Optional
from Tree.enums import ValueMode

# Static counter for node IDs (for visualization/debugging)
_node_counter = 0
def get_next_node_id():
    global _node_counter
    _node_counter += 1
    return _node_counter


class BaseNode:
    """Base class for B+ tree nodes (internal + leaf)."""
    def __init__(self):
        self.keys: List[str] = []
        self.parent: Optional['InternalNode'] = None
        self.id: int = get_next_node_id()

    def is_leaf(self) -> bool:
        return False  # overridden in LeafNode

    def __repr__(self):
        return f"{self.__class__.__name__}(id={self.id}, keys={self.keys})"


class LeafNode(BaseNode):
    """Leaf node: stores actual data references + linked list pointers."""
    def __init__(self, value_mode: ValueMode = ValueMode.KEY_ONLY):
        super().__init__()
        self.values: List[Optional[object]] = []  # aligned with keys
        self.next_leaf: Optional['LeafNode'] = None
        self.prev_leaf: Optional['LeafNode'] = None
        self.value_mode = value_mode

    def is_leaf(self) -> bool:
        return True

    def is_full(self, order_leaf: int) -> bool:
        return len(self.keys) > order_leaf

    def min_keys(self, order_leaf: int) -> int:
        return (order_leaf + 1) // 2  # ceil rule

    def __repr__(self):
        return f"LeafNode(id={self.id}, keys={self.keys})"


class InternalNode(BaseNode):
    """Internal node: stores keys and children pointers."""
    def __init__(self):
        super().__init__()
        self.children: List[BaseNode] = []

    def is_full(self, order_internal: int) -> bool:
        return len(self.children) > order_internal

    def min_children(self, order_internal: int) -> int:
        return (order_internal + 1) // 2

    def __repr__(self):
        return f"InternalNode(id={self.id}, keys={self.keys})"
