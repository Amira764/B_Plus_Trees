# Tree/node.py

from typing import List, Optional
from Tree.enums import ValueMode

# Static counter for node IDs (for visualization/debugging)
_node_counter = 0
def get_next_node_id():
    global _node_counter
    pass


class BaseNode:
    """Base class for B+ tree nodes (internal + leaf)."""
    def __init__(self):
        pass

    def is_leaf(self) -> bool:
        pass

    def __repr__(self):
        pass


class LeafNode(BaseNode):
    """Leaf node: stores actual data references + linked list pointers."""
    def __init__(self, value_mode: ValueMode = ValueMode.KEY_ONLY):
        pass

    def is_leaf(self) -> bool:
        pass

    def is_full(self, order_leaf: int) -> bool:
        pass

    def min_keys(self, order_leaf: int) -> int:
        pass

    def __repr__(self):
        pass


class InternalNode(BaseNode):
    """Internal node: stores keys and children pointers."""
    def __init__(self):
        pass

    def is_full(self, order_internal: int) -> bool:
        pass

    def min_children(self, order_internal: int) -> int:
        pass

    def __repr__(self):
        pass
