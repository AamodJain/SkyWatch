from fastapi import APIRouter
from pydantic import BaseModel
import time
from typing import Optional
from app.config import settings

router = APIRouter(prefix="/api/density", tags=["density"])

# Global state to hold density data from multiple concurrent CV pipelines
# Maps source URL to its latest density data
active_streams = {}

# Keep the old single-stream format for backwards compatibility
current_density_data = {
    "headcount": 0.0,
    "points_count": 0,
    "timestamp": None,
    "source": None,
    "drone_id": None,
    "drone_name": None,
    "zone": None,
    "latitude": None,
    "longitude": None,
    "altitude": None,
    "loop_video": True,
}

class DensityUpdate(BaseModel):
    headcount: float
    timestamp: float
    points_count: int
    source: str
    drone_id: Optional[str] = None
    drone_name: Optional[str] = None
    zone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    loop_video: Optional[bool] = True


def _prune_stale_streams() -> None:
    now = time.time()
    stale_sources = []
    for source, stream_data in active_streams.items():
        ts = stream_data.get("timestamp")
        if ts is None or (now - float(ts)) > settings.STREAM_STALE_SECONDS:
            stale_sources.append(source)

    for source in stale_sources:
        active_streams.pop(source, None)

@router.post("/update")
async def update_current_density(data: DensityUpdate):
    """Receive live stream density data from the CV pipeline.
    
    Supports multiple concurrent streams. Each stream identified by source URL.
    """
    global current_density_data, active_streams
    _prune_stale_streams()
    
    # Store in multi-stream dictionary
    active_streams[data.source] = {
        "headcount": data.headcount,
        "points_count": data.points_count,
        "timestamp": data.timestamp,
        "source": data.source,
        "drone_id": data.drone_id,
        "drone_name": data.drone_name,
        "zone": data.zone,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "altitude": data.altitude,
        "loop_video": data.loop_video,
    }
    
    # Also update the single-stream format for backwards compatibility
    current_density_data.update({
        "headcount": data.headcount,
        "points_count": data.points_count,
        "timestamp": data.timestamp,
        "source": data.source,
        "drone_id": data.drone_id,
        "drone_name": data.drone_name,
        "zone": data.zone,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "altitude": data.altitude,
        "loop_video": data.loop_video,
    })
    
    return {"status": "success"}

@router.get("/current")
async def get_current_density():
    """Get current crowd density data for all active zones."""
    _prune_stale_streams()
    return {
        "current_data": current_density_data,
        "active_streams": active_streams,
    }


@router.get("/history")
async def get_density_history(zone_id: str = None, hours: int = 24):
    """Get historical density data."""
    # TODO: Implement historical data query
    return {"history": [], "zone_id": zone_id, "hours": hours}


@router.get("/heatmap")
async def get_heatmap_data():
    """Get heatmap data points for map visualization."""
    # TODO: Implement heatmap data generation
    return {"points": [], "timestamp": None}
