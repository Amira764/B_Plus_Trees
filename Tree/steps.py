# Tree/steps.py

from typing import List
from Tree.enums import StepType
from Tree.node import LeafNode, InternalNode


class Step:
    """Base class for all B+ tree operation steps."""
    def __init__(self, step_type: StepType, message: str):
        self.step_type = step_type
        self.message = message

    def __repr__(self):
        return f"{self.step_type.name}: {self.message}"


# =============== #
# INSERTION STEPS #
# =============== #

class InsertLeafStep(Step):
    def __init__(self, leaf: LeafNode, key: str, index: int, before: List[str], after: List[str]):
        super().__init__(
            StepType.INSERT_LEAF,
            f"Inserted key {key} into Leaf {leaf.id} at index {index}."
        )
        self.leaf = leaf
        self.key = key
        self.index = index
        self.before = before
        self.after = after


class SplitLeafStep(Step):
    def __init__(self,
                 old_leaf: LeafNode,
                 new_leaf: LeafNode,
                 promoted_key: str,
                 before: List[str],
                 left_after: List[str],
                 right_after: List[str]):
        super().__init__(
            StepType.SPLIT_LEAF,
            f"Leaf {old_leaf.id} split. Promoted key {promoted_key}."
        )
        self.old_leaf = old_leaf
        self.new_leaf = new_leaf
        self.promoted_key = promoted_key
        self.before = before
        self.left_after = left_after
        self.right_after = right_after


class SplitInternalStep(Step):
    def __init__(self,
                 old_node: InternalNode,
                 new_node: InternalNode,
                 promoted_key: str,
                 before: List[str],
                 left_after: List[str],
                 right_after: List[str]):
        super().__init__(
            StepType.SPLIT_INTERNAL,
            f"Internal Node {old_node.id} split. Promoted {promoted_key}."
        )
        self.old_node = old_node
        self.new_node = new_node
        self.promoted_key = promoted_key
        self.before = before
        self.left_after = left_after
        self.right_after = right_after


class NewRootStep(Step):
    def __init__(self, old_root, new_root):
        super().__init__(
            StepType.NEW_ROOT,
            f"Created new root {new_root.id}."
        )
        self.old_root = old_root
        self.new_root = new_root


# ============== #
# DELETION STEPS #
# ============== #

class BorrowLeftStep(Step):
    pass

class BorrowRightStep(Step):
    pass

class MergeStep(Step):
    pass

class DeleteLeafStep(Step):
    pass

class NotFoundStep(Step):
    pass
