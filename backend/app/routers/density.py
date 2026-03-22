from fastapi import APIRouter
from pydantic import BaseModel
import time

router = APIRouter(prefix="/api/density", tags=["density"])

# Global state to hold the latest density data from the CV pipeline
current_density_data = {
    "headcount": 0.0,
    "points_count": 0,
    "timestamp": None
}

class DensityUpdate(BaseModel):
    headcount: float
    timestamp: float
    points_count: int

@router.post("/update")
async def update_current_density(data: DensityUpdate):
    """Receive live stream density data from the CV pipeline."""
    global current_density_data
    current_density_data["headcount"] = data.headcount
    current_density_data["points_count"] = data.points_count
    current_density_data["timestamp"] = data.timestamp
    return {"status": "success"}

@router.get("/current")
async def get_current_density():
    """Get current crowd density data for all active zones."""
    return {"current_data": current_density_data}


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
