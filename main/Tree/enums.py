# Tree/enums.py

from enum import Enum

class ValueMode(Enum):
    """
    Defines what leaf nodes store as values.
    - KEY_ONLY: no values, visualization only
    - BLOCK_PTR: (block_id, offset) tuple
    - RECORD_OBJ: full record object
    """
    KEY_ONLY = 1
    BLOCK_PTR = 2
    RECORD_OBJ = 3


class StepType(Enum):
    """
    Types of structural steps produced by B+ tree operations.
    The UI will use these labels to decide animation behavior.
    """
    INSERT_LEAF = 1
    SPLIT_LEAF = 2
    SPLIT_INTERNAL = 3
    DELETE_LEAF = 4
    BORROW_LEFT = 5
    BORROW_RIGHT = 6
    MERGE = 7
    NEW_ROOT = 8
    NOT_FOUND = 9
