from fastapi import APIRouter
from app.config import settings
from app.routers.density import current_density_data, active_streams
from pathlib import Path
import time
from urllib.parse import urlparse

router = APIRouter(prefix="/api/drones", tags=["drones"])

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v"}


def _list_video_files() -> list[Path]:
    video_dir = Path(settings.MEDIA_VIDEOS_DIR)
    if not video_dir.exists():
        return []
    return sorted(
        [p for p in video_dir.iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS],
        key=lambda p: p.name.lower(),
    )


def _get_active_sources() -> set[str]:
    """Extract all active source video names from concurrent streams."""
    active_names = set()
    now = time.time()
    for source, stream_data in active_streams.items():
        ts = stream_data.get("timestamp")
        if ts is None or (now - float(ts)) > settings.STREAM_STALE_SECONDS:
            continue
        parsed = urlparse(source)
        video_name = Path(parsed.path if parsed.scheme else source).name
        active_names.add(video_name)
    return active_names


def _get_stream_data_for_source(source_name: str) -> dict:
    """Get the stream data for a specific source video name."""
    now = time.time()
    for source_url, stream_data in active_streams.items():
        ts = stream_data.get("timestamp")
        if ts is None or (now - float(ts)) > settings.STREAM_STALE_SECONDS:
            continue
        parsed = urlparse(source_url)
        video_name = Path(parsed.path if parsed.scheme else source_url).name
        if video_name == source_name:
            return stream_data
    return None


def _build_drones_payload() -> list[dict]:
    files = _list_video_files()
    active_source_names = _get_active_sources()
    
    base_lat, base_lng = 28.6139, 77.2090
    drones = []

    for idx, video in enumerate(files):
        is_active = video.name in active_source_names
        
        # Get stream-specific data if active
        stream_data = _get_stream_data_for_source(video.name) if is_active else None
        
        if is_active and stream_data:
            # Use data from the specific stream
            points = int(stream_data.get("points_count") or 0)
            density = float(stream_data.get("headcount") or 0.0)
            drone_id = stream_data.get("drone_id") or f"DRN-{idx + 1:03d}"
            name = stream_data.get("drone_name") or video.stem
            zone = stream_data.get("zone") or "Live Stream Zone"
            lat = float(stream_data.get("latitude") or base_lat + (idx * 0.003))
            lng = float(stream_data.get("longitude") or base_lng + (idx * 0.003))
            altitude = float(stream_data.get("altitude") or 100)
        else:
            # Default values for inactive drones
            points = 0
            density = 0.0
            drone_id = f"DRN-{idx + 1:03d}"
            name = video.stem
            zone = "Live Stream Zone"
            lat = base_lat + (idx * 0.003)
            lng = base_lng + (idx * 0.003)
            altitude = 100

        drones.append(
            {
                "id": drone_id,
                "name": name,
                "status": "active" if is_active else "idle",
                "latitude": lat,
                "longitude": lng,
                "altitude": altitude,
                "battery": 100,
                "peopleCounted": points,
                "headcountDensity": density,
                "zone": zone,
                "video_url": f"http://localhost:{settings.API_PORT}/videos/{video.name}",
            }
        )

    return drones


def _is_live_stream_active() -> bool:
    """Check if any stream is currently active."""
    if not active_streams:
        return False
    
    now = time.time()
    for stream_data in active_streams.values():
        ts = stream_data.get("timestamp")
        if ts and (now - float(ts)) <= settings.STREAM_STALE_SECONDS:
            return True
    return False


@router.get("/")
async def get_drones(include_debug: bool = False):
    """Get active drones only when live stream processor is pushing data.

    Set include_debug=true to expose file-playback streams for UI debugging.
    """
    live_active = _is_live_stream_active()
    debug_mode = include_debug or settings.ALLOW_DEBUG_PLAYBACK
    if not live_active and not debug_mode:
        return {
            "drones": [],
            "count": 0,
            "video_dir": settings.MEDIA_VIDEOS_DIR,
            "live_active": False,
            "debug_mode": False,
        }

    drones = _build_drones_payload()
    if not live_active and debug_mode:
        drones = [{**d, "status": "debug"} for d in drones]

    return {
        "drones": drones,
        "count": len(drones),
        "video_dir": settings.MEDIA_VIDEOS_DIR,
        "live_active": live_active,
        "debug_mode": debug_mode,
    }


@router.get("/videos")
async def get_videos(include_debug: bool = False):
    """Get list of currently served video files."""
    live_active = _is_live_stream_active()
    debug_mode = include_debug or settings.ALLOW_DEBUG_PLAYBACK
    if not live_active and not debug_mode:
        return {"videos": [], "count": 0, "video_dir": settings.MEDIA_VIDEOS_DIR, "live_active": False, "debug_mode": False}

    files = _list_video_files()
    videos = [
        {
            "name": p.name,
            "url": f"http://localhost:{settings.API_PORT}/videos/{p.name}",
            "size_bytes": p.stat().st_size,
        }
        for p in files
    ]
    return {
        "videos": videos,
        "count": len(videos),
        "video_dir": settings.MEDIA_VIDEOS_DIR,
        "live_active": live_active,
        "debug_mode": debug_mode,
    }


@router.get("/{drone_id}/feed")
async def get_drone_feed(drone_id: str):
    """Get live feed URL for a specific drone."""
    drones = _build_drones_payload()
    drone = next((d for d in drones if d["id"] == drone_id), None)
    if drone is None:
        return {"drone_id": drone_id, "feed_url": None, "status": "offline"}
    return {"drone_id": drone_id, "feed_url": drone["video_url"], "status": drone["status"]}
