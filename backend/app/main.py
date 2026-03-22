from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.routers import density, drone
import os

app = FastAPI(
    title="Drone Surveillance API",
    description="Backend API for drone-based crowd density monitoring",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(density.router)
app.include_router(drone.router)

os.makedirs(settings.MEDIA_VIDEOS_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=settings.MEDIA_VIDEOS_DIR), name="videos")

@app.get("/")
async def root():
    return {"status": "online", "service": "Drone Surveillance API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
