# Temporary file when you need to test anything during development
# to be deleted when we are done developing


from Tree.bptree import BPlusTree, DuplicateKeyError
from Tree.enums import ValueMode

def test_non_unique_inserts():
    print("=== NON-UNIQUE MODE TEST ===")
    tree = BPlusTree(order_internal=3, order_leaf=2, unique=False, value_mode=ValueMode.KEY_ONLY)
    seq = [10, 20, 30, 40, 50]  # will cause splits with pleaf=2
    for k in seq:
        steps = tree.insert(k, value=f"R{k}")
        print(f"Inserted {k}, emitted {len(steps)} step(s).")
        for s in steps:
            print("  ", s)
    # insert duplicates
    tree.insert(20, value="R20-dup1")
    tree.insert(20, value="R20-dup2")
    res = tree.search(20)
    print("Search(20) ->", res)  # should be list

def test_unique_inserts():
    print("\n=== UNIQUE MODE TEST ===")
    tree = BPlusTree(order_internal=3, order_leaf=2, unique=True, value_mode=ValueMode.KEY_ONLY)
    tree.insert(5, value="R5")
    print("Inserted 5")
    try:
        print("Inserting duplicate 5 (should raise)...")
        tree.insert(5, value="R5-dup")
    except DuplicateKeyError as e:
        print("Caught DuplicateKeyError as expected:", e)

def main():
    test_non_unique_inserts()
    test_unique_inserts()
    # show final tree structure (levels)
    print("\nFinal tree levels (print node ids and keys):")
    t = BPlusTree(order_internal=3, order_leaf=2, unique=False)
    for k in [1,2,3,4,5,6,7]:
        t.insert(k)
    levels = t.traverse()
    for lvl, nodes in enumerate(levels):
        row = [f"{n}" for n in nodes]
        print(f"Level {lvl}: {row}")

if __name__ == "__main__":
    main()


