"""
Detection module - uses SDNet density map estimation for accurate crowd counting.
"""
import cv2
from typing import List, Tuple
from sdnet_detector import SDNetDetector
import os

class PersonDetector:
    def __init__(self, model_path: str = None, device: str = None):
        """
        Initializes the SDNet-based person detector.
        
        Args:
            model_path: Path to pre-trained SDNet weights (.pth file).
                        If None, auto-detects from the MovingDroneCrowd folder.
            device: 'cuda' or 'cpu'. Auto-detected if None.
        """
        if model_path is None:
            # Auto-detect the weights file
            mdc_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'MovingDroneCrowd')
            for f in os.listdir(mdc_root):
                if f.endswith('.pth'):
                    model_path = os.path.join(mdc_root, f)
                    break
            if model_path is None:
                raise FileNotFoundError("Could not find SDNet .pth weights in MovingDroneCrowd folder.")
        
        self.detector = SDNetDetector(weights_path=model_path, device=device)
        
    def detect_people(self, frame: cv2.typing.MatLike) -> Tuple[List[Tuple[int, int]], float]:
        """
        Runs SDNet inference on a frame and returns:
        1. Ground-contact points (x, y) of detected people (from density map peaks).
        2. The estimated headcount (float, from density map integration).
        
        Returns:
            Tuple of (list of (x, y) pixel coordinates, headcount float)
        """
        headcount, density_map, points = self.detector.detect(frame)
        return points, headcount
    
    def reset(self):
        """Reset internal frame buffer (for new video)."""
        self.detector.reset()
