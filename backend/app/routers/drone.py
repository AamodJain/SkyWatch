from fastapi import APIRouter

router = APIRouter(prefix="/api/drones", tags=["drones"])


@router.get("/")
async def get_drones():
    """Get list of all registered drones and their status."""
    # TODO: Implement database query
    return {"drones": []}


@router.get("/{drone_id}/feed")
async def get_drone_feed(drone_id: str):
    """Get live feed URL for a specific drone."""
    # TODO: Implement RTSP feed retrieval
    return {"drone_id": drone_id, "feed_url": None, "status": "offline"}
