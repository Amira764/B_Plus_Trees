# File: bplustree.py
# This file contains the main BPlusTree class.
# It manages the nodes and implements the core logic for
# insertion, deletion, and searching.
# This corresponds to Module 3 in Internal_Info.html

# Import the node classes from your other file
from node import Node, InternalNode, LeafNode

class BPlusTree:
    """
    The BPlusTree class manages all tree operations (insert, delete, find)
    and maintains the root of the tree.
    """
    def __init__(self):
        # [cite_start]Per assignment: P=3 for internal, p_leaf=2 for leaf [cite: 55]
        self.internal_order = 3
        self.leaf_order = 2
        
        # The root starts as an empty leaf node
        self.root: Node = LeafNode()

    def find(self, ssn: str) -> tuple:
        """
        Finds the data pointer for a given SSN.
        Returns:
            A tuple (block_id, record_offset) if found, else None.
       
        """
        # TODO: Implement search logic.
        # Start at self.root and traverse down to the correct leaf node.
        # Then, search the leaf's keys for the SSN.
        pass

    def insert(self, ssn: str, record_pointer: tuple):
        """
        Inserts a key (SSN) and its corresponding data pointer
        (record_pointer) into the tree.
        """
        print(f"--- INSERTING {ssn} ---")
        
        # 1. Find the target leaf node to insert into
        # (You can adapt your `find` logic for this)
        
        # 2. Insert the key/pointer into the leaf
        
        # 3. Check if the leaf is full (size > self.leaf_order)
        # If it is, call a helper method like self._split_leaf(leaf_node)
        
        # TODO: Implement insertion logic
        pass

    def delete(self, ssn: str):
        """
        Deletes a key (SSN) and its data pointer from the tree
       .
        """
        print(f"--- DELETING {ssn} ---")

        # 1. Find the target leaf node containing the SSN
        
        # 2. Remove the key/pointer from the leaf
        
        # 3. Check if the leaf is underfull (size < ceil(p_leaf / 2))
        # Per assignment, p_leaf=2, so min keys = ceil(2/2) = 1.
        # Underfull if size < 1 (i.e., empty)
        
        # 4. If underfull, handle redistribution/merging:
        #    [cite_start]- Try borrowing from left sibling first [cite: 42]
        #    - If not possible, try borrowing from right sibling
        #    [cite_start]- If not possible, merge with a sibling (left first) [cite: 43]
        
        # [cite_start]5. Make sure to update parent keys if necessary [cite: 44]
        
        # TODO: Implement deletion logic
        pass

    def _split_leaf(self, leaf: LeafNode):
        """
        Splits a full leaf node into two.
        """
        # TODO:
        # 1. Create a new LeafNode
        # 2. Distribute keys/pointers based on assignment rules:
        #    [cite_start]- "right node has more values" [cite: 26]
        #    - For p_leaf=2, a split of 3 keys becomes [1] and [2]
        # [cite_start]3. Get the "middle" key (smallest in the new right node) [cite: 27]
        # 4. Insert this key into the parent, which might cause the parent
        #    [cite_start]to split (call _split_internal) [cite: 27]
        pass

    def _split_internal(self, node: InternalNode):
        """
        Splits a full internal node into two.
        """
        # TODO:
        # 1. Create a new InternalNode
        # 2. Distribute keys/children based on assignment rules:
        #    [cite_start]- Middle key = Floor((#nodes + 1)/2) [cite: 32]
        #    - For P=3, a split of 3 keys becomes [1] and [1], with
        #      the middle key going up.
        # [cite_start]3. The "middle" key goes up to the parent [cite: 31]
        # 4. This might cause a recursive split up to the root.
        pass

    def print_tree(self):
        """
        Prints the current state of the tree in a user-friendly way,
        likely using a level-order (BFS) traversal 
       .
        """
        print("--- CURRENT TREE STATE ---")
        if not self.root:
            print("Tree is empty.")
            return

        q = [(self.root, 0)]  # Queue of (node, level)
        current_level = 0

        while q:
            node, level = q.pop(0)
            
            if level > current_level:
                print()  # Newline for new level
                current_level = level
            
            if node.is_leaf:
                print(f"[LEAF: {node.keys}] ", end="")
            else:
                print(f"(INTERNAL: {node.keys}) ", end="")
                for child in node.children:
                    q.append((child, level + 1))
        
        print("\n--------------------------")