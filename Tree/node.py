# File: bptree_nodes.py
# This file contains the classes for the nodes of the B+ tree.
# This corresponds to Module 2 in Internal_Info.html

from typing import List, Optional, Union

class Node:
    """
    A base class for B+ tree nodes.
    It stores keys, a parent pointer, and a flag for leaf status 
   .
    """
    def __init__(self, parent: Optional['InternalNode'] = None, is_leaf: bool = False):
        self.keys: List[str] = []  # SSN keys
        self.parent: Optional['InternalNode'] = parent
        self.is_leaf: bool = is_leaf

    def is_full(self) -> bool:
        """Checks if the node has reached its maximum capacity."""
        raise NotImplementedError

    def get_size(self) -> int:
        """Returns the current number of keys in the node."""
        return len(self.keys)

class InternalNode(Node):
    """
    Represents an internal node in the B+ tree.
    It stores keys to guide the search and pointers to its child nodes
   .
    
    Assignment constraint: order P=3[cite: 55].
    This means:
    - Max children = 3
    - Max keys = 2 (P - 1)
    """
    def __init__(self, parent: Optional['InternalNode'] = None):
        super().__init__(parent, is_leaf=False)
        self.children: List[Union['InternalNode', 'LeafNode']] = []
        # Per assignment, P = 3 [cite: 55]
        self.max_size = 3  # Max number of *children*

    def is_full(self) -> bool:
        """Internal node is full if it has P children."""
        return len(self.children) >= self.max_size

class LeafNode(Node):
    """
    Represents a leaf node in the B+ tree.
    It stores keys and data pointers (references to the record's 
    location in a block).
    
    Assignment constraint: order p_leaf=2[cite: 55].
    This means:
    - Max keys (and data pointers) = 2
    """
    def __init__(self, parent: Optional['InternalNode'] = None):
        super().__init__(parent, is_leaf=True)
        # data_pointers will store the (block_id, record_offset) tuple
        # as suggested in the FileIndexManager
        self.data_pointers: List[tuple] = []
        
        # Pointers for leaf-level linked list
        self.next_leaf: Optional['LeafNode'] = None
        self.prev_leaf: Optional['LeafNode'] = None
        
        # Per assignment, p_leaf = 2 [cite: 55]
        self.max_size = 2  # Max number of *keys* / *data_pointers*

    def is_full(self) -> bool:
        """Leaf node is full if it has p_leaf keys."""
        return self.get_size() >= self.max_size