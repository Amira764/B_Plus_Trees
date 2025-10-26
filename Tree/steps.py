# Tree/steps.py

from typing import List
from Tree.enums import StepType
from Tree.node import LeafNode, InternalNode


class Step:
    """Base class for all B+ tree operation steps."""
    def __init__(self, step_type: StepType, message: str):
        pass

    def __repr__(self):
        pass


# =============== #
# INSERTION STEPS #
# =============== #

class InsertLeafStep(Step):
    def __init__(self, leaf: LeafNode, key: str, index: int, before: List[str], after: List[str]):
        pass


class SplitLeafStep(Step):
    def __init__(self,
                 old_leaf: LeafNode,
                 new_leaf: LeafNode,
                 promoted_key: str,
                 before: List[str],
                 left_after: List[str],
                 right_after: List[str]):
        pass


class SplitInternalStep(Step):
    def __init__(self,
                 old_node: InternalNode,
                 new_node: InternalNode,
                 promoted_key: str,
                 before: List[str],
                 left_after: List[str],
                 right_after: List[str]):
        pass


class NewRootStep(Step):
    def __init__(self, old_root, new_root):
        pass


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
