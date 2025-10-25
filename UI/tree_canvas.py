from PyQt5.QtWidgets import QFrame
from PyQt5.QtGui import QPainter, QColor, QPen, QBrush, QFont
from PyQt5.QtCore import Qt

class TreeCanvas(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.tree_data = None  # T2 sample will be loaded

    def paintEvent(self, event):
        if not self.tree_data:
            return

        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        # Dark background
        painter.fillRect(self.rect(), QColor("#1E1E1E"))

        nodes = self.tree_data["nodes"]
        positions = self.tree_data["positions"]

        font = QFont("Arial", 10)
        painter.setFont(font)

        # Draw edges
        pen = QPen(QColor("#CCCCCC"), 2)
        painter.setPen(pen)
        root = self.tree_data["root"]

        def draw_edges(node_id):
            node = nodes[node_id]
            x, y = positions[node_id]
            if not node["is_leaf"]:
                for child in node["children"]:
                    cx, cy = positions[child]
                    painter.drawLine(x+40, y+30, cx+40, cy)  # center-ish line
                    draw_edges(child)

        draw_edges(root)

        # Draw nodes
        for node_id, node in nodes.items():
            x, y = positions[node_id]
            rect_color = QColor("#5FE8D6") if not node["is_leaf"] else QColor("#FF5FA2")
            painter.setBrush(QBrush(rect_color))
            painter.setPen(QPen(Qt.transparent))
            painter.drawRoundedRect(x, y, 80, 40, 12, 12)

            painter.setPen(QPen(Qt.black))
            keys_text = " | ".join(node["keys"])
            painter.drawText(x+10, y+25, keys_text)

        # Draw leaf arrows
        painter.setPen(QPen(QColor("#5FE8D6"), 2))
        for node_id, node in nodes.items():
            if node["is_leaf"] and node["next"]:
                x1, y1 = positions[node_id]
                x2, y2 = positions[node["next"]]
                painter.drawLine(x1+80, y1+20, x2, y2+20)

