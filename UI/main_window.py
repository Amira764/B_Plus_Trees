from PyQt5.QtWidgets import QApplication, QWidget, QHBoxLayout, QVBoxLayout, QPushButton, QTextEdit, QLabel, QFrame
from tree_canvas import TreeCanvas
from controller import UIController
import sys

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("B+ Tree Visualizer")
        self.setMinimumSize(1100, 600)
        self.setStyleSheet("background-color: #1E1E1E;")  # Dark mode background

        # Main horizontal layout
        main_layout = QHBoxLayout(self)

        # Canvas (left side)
        self.canvas = TreeCanvas(self)
        self.canvas.setFrameShape(QFrame.Box)
        self.canvas.setStyleSheet("background-color: #1E1E1E; border: 0px;")
        main_layout.addWidget(self.canvas, stretch=3)

        # Right side (buttons + info)
        right_panel = QVBoxLayout()
        main_layout.addLayout(right_panel, stretch=1)

        # Buttons
        for text in ["Insert", "Search", "Next Step", "Previous Step", "Auto Play", "Reset"]:
            btn = QPushButton(text)
            btn.setStyleSheet("background-color:#333;color:white; padding:8px;")
            right_panel.addWidget(btn)

        # Info panel
        right_panel.addWidget(QLabel("Step Info:", styleSheet="color:white"))
        self.info_box = QTextEdit()
        self.info_box.setReadOnly(True)
        self.info_box.setStyleSheet("background-color:#111;color:white;")
        right_panel.addWidget(self.info_box)

        # Controller
        self.controller = UIController(self.canvas, self.info_box)
        self.controller.load_sample_tree()
        self.canvas.update()

def run_app():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    run_app()
