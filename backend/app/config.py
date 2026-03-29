import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://dep_user:dep_password@localhost:5432/dep_db",
    )
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")
    RTSP_URL: str = os.getenv("RTSP_URL", "rtsp://localhost:8554/live")
    FRAME_INTERVAL: int = int(os.getenv("FRAME_INTERVAL", "1"))
    YOLO_MODEL: str = os.getenv("YOLO_MODEL", "yolov8n.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
    MEDIA_VIDEOS_DIR: str = os.getenv(
        "MEDIA_VIDEOS_DIR",
        str(Path(__file__).resolve().parents[2] / "media" / "videos"),
    )
    STREAM_STALE_SECONDS: int = int(os.getenv("STREAM_STALE_SECONDS", "5"))
    ALLOW_DEBUG_PLAYBACK: bool = os.getenv("ALLOW_DEBUG_PLAYBACK", "false").lower() == "true"
    HISTORY_SAMPLE_SECONDS: int = int(os.getenv("HISTORY_SAMPLE_SECONDS", "5"))
    HISTORY_DEFAULT_WINDOW_HOURS: int = int(os.getenv("HISTORY_DEFAULT_WINDOW_HOURS", "2"))
    HISTORY_MAX_WINDOW_HOURS: int = int(os.getenv("HISTORY_MAX_WINDOW_HOURS", "6"))


settings = Settings()
