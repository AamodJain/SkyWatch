import cv2
import time
import requests
import argparse
from detection import PersonDetector

# FastAPI endpoint for updating live density
API_UPDATE_URL = "http://127.0.0.1:8000/api/density/update"

def process_stream(source: str, target_fps: int = 5):
    """
    Process a live video stream (file or URL) at a given FPS,
    estimate crowd density, and post the data to the backend.
    """
    print(f"Starting real-time stream processor on source: {source} at {target_fps} FPS")
    
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Error: Could not open stream source {source}")
        return

    # Check source FPS to determine skipping, but for a live URL,
    # grabbing a frame, reading it, then time.sleep(1/target_fps) works better.
    # We will use explicit sleep to enforce 5 FPS processing on the live feed.
    
    detector = PersonDetector()
    
    loop_delay = 1.0 / target_fps
    
    frame_count = 0
    
    try:
        while True:
            start_time = time.time()
            ret, frame = cap.read()
            
            # If the video ends and it's a file, loop it (simulate live stream)
            if not ret:
                print("End of stream reached. Looping...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            frame_count += 1
            
            # Detect people
            points, headcount = detector.detect_people(frame)
            
            payload = {
                "headcount": float(headcount),
                "timestamp": time.time(),
                "points_count": len(points)
            }
            
            # Send to backend
            try:
                response = requests.post(API_UPDATE_URL, json=payload, timeout=2)
                print(f"Frame {frame_count}: Headcount {headcount:.1f} -> {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"Frame {frame_count}: Headcount {headcount:.1f} -> Backend unavailable ({e})")
            
            # Enforce 5 FPS target rate
            elapsed_time = time.time() - start_time
            sleep_time = loop_delay - elapsed_time
            
            if sleep_time > 0:
                time.sleep(sleep_time)
                
    except KeyboardInterrupt:
        print("Stream processor stopped by user.")
    finally:
        cap.release()
        print("Released video capture.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Live Stream Density Processor")
    parser.add_argument("--source", type=str, default="../video-stream/sample_crowd.mp4", 
                        help="Path to video file or URL for live feed")
    parser.add_argument("--fps", type=int, default=5, help="Target processing frames per second")
    args = parser.parse_args()
    
    process_stream(args.source, args.fps)
