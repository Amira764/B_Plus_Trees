class UIController:
    def __init__(self, canvas, info_box):
        self.canvas = canvas
        self.info_box = info_box

    def log(self, msg):
        self.info_box.append(msg)

    def load_sample_tree(self):
        # T2 SAMPLE (hardcoded for now)
        self.canvas.tree_data = {
            "root": 1,
            "nodes": {
                1: {"keys": ["20", "40"], "is_leaf": False, "children": [2, 3, 4]},
                2: {"keys": ["10"], "is_leaf": False, "children": [5, 6]},
                3: {"keys": ["30"], "is_leaf": False, "children": [7, 8]},
                4: {"keys": ["50"], "is_leaf": False, "children": [9, 10]},
                5: {"keys": ["5", "7"], "is_leaf": True, "next": 6},
                6: {"keys": ["10", "15"], "is_leaf": True, "next": 7},
                7: {"keys": ["22", "28"], "is_leaf": True, "next": 8},
                8: {"keys": ["32", "39"], "is_leaf": True, "next": 9},
                9: {"keys": ["50", "55"], "is_leaf": True, "next": 10},
                10: {"keys": ["60", "70"], "is_leaf": True, "next": None},
            },
            "positions": {
                1: (350, 50),
                2: (200, 150),
                3: (350, 150),
                4: (500, 150),
                5: (100, 250),
                6: (200, 250),
                7: (300, 250),
                8: (400, 250),
                9: (500, 250),
                10: (600, 250),
            }
        }
