from PyQt5.QtWidgets import QFrame
from PyQt5.QtGui import QPainter, QColor, QPen, QBrush, QFont, QPolygon
from PyQt5.QtCore import Qt, QPoint

class TreeCanvas(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.tree_data = None
        self.box_width = 40
        self.box_height = 40
        self.spacing = 4
        self.font = QFont("Segoe UI", 11, QFont.Bold)

    def paintEvent(self, event):
        if not self.tree_data:
            return

        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        # Background
        painter.fillRect(self.rect(), QColor("#1C1C1C"))

        nodes = self.tree_data["nodes"]
        positions = self.tree_data["positions"]
        root = self.tree_data["root"]

        painter.setFont(self.font)

        # Draw edges recursively
        pen = QPen(QColor("#555555"), 2)
        painter.setPen(pen)

        def draw_edges(node_id):
            node = nodes[node_id]
            x, y = positions[node_id]

            if not node["is_leaf"]:
                k = len(node["keys"])
                child_count = len(node["children"])
                # N keys → N+1 child positions
                child_x_positions = []
                bx_start = x
                # left edge of first key
                child_x_positions.append(bx_start)
                # midpoints between keys
                for i in range(k-1):
                    mid = bx_start + (i+1)*(self.box_width + self.spacing) - self.spacing//2
                    child_x_positions.append(mid)
                # right edge of last key
                child_x_positions.append(bx_start + k*(self.box_width + self.spacing))

                for i, child in enumerate(node["children"]):
                    cx, cy = positions[child]
                    start_x = child_x_positions[i] + self.box_width//2
                    start_y = y + self.box_height
                    end_x = cx + len(nodes[child]["keys"])*(self.box_width + self.spacing)//2
                    end_y = cy
                    self.draw_arrow(painter, start_x, start_y, end_x, end_y)
                    draw_edges(child)

        draw_edges(root)

        # Draw nodes (split each key)
        for node_id, node in nodes.items():
            x, y = positions[node_id]
            for i, key in enumerate(node["keys"]):
                bx = x + i * (self.box_width + self.spacing)
                by = y

                # Box: sharp rectangle
                painter.setBrush(QBrush(QColor("#1C1C1C")))
                border_color = QColor("#4DD0E1") if not node["is_leaf"] else QColor("#FF80AB")
                painter.setPen(QPen(border_color, 2))
                painter.drawRect(int(bx), int(by), self.box_width, self.box_height)

                # Text centered
                painter.setPen(QPen(border_color))
                painter.drawText(int(bx), int(by), self.box_width, self.box_height,
                                 Qt.AlignCenter, str(key))

        # Draw leaf arrows (horizontal to next)
        for node_id, node in nodes.items():
            if node["is_leaf"] and node.get("next") is not None:
                x1, y1 = positions[node_id]
                x2, y2 = positions[node["next"]]
                start_x = int(x1 + len(node["keys"])*(self.box_width + self.spacing))
                start_y = int(y1 + self.box_height//2)
                end_x = int(x2)
                end_y = int(y2 + self.box_height//2)
                self.draw_arrow(painter, start_x, start_y, end_x, end_y)

    def draw_arrow(self, painter, x1, y1, x2, y2):
        """Draw a line with a triangle arrowhead."""
        painter.drawLine(int(x1), int(y1), int(x2), int(y2))

        size = 8
        dx = x2 - x1
        dy = y2 - y1

        if abs(dx) >= abs(dy):  # mostly horizontal
            p1 = QPoint(int(x2), int(y2))
            p2 = QPoint(int(x2 - size), int(y2 - size//2))
            p3 = QPoint(int(x2 - size), int(y2 + size//2))
        else:  # mostly vertical/diagonal
            p1 = QPoint(int(x2), int(y2))
            p2 = QPoint(int(x2 - size//2), int(y2 - size))
            p3 = QPoint(int(x2 + size//2), int(y2 - size))

        painter.setBrush(QBrush(painter.pen().color()))
        painter.drawPolygon(QPolygon([p1, p2, p3]))
