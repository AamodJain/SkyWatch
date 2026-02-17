# Drone-Based Surveillance Portal

Real-time crowd density visualization system using drone video feeds, AI-based detection, and interactive heatmap overlays.

## Architecture

```
Drone Feed (RTSP) → Video Processor (YOLO/OpenCV) → FastAPI Backend → React Dashboard
                                                          ↕
                                                   PostgreSQL + PostGIS
```

## Tech Stack

| Layer            | Technology                    |
|------------------|-------------------------------|
| Frontend         | React, Tailwind CSS, Leaflet  |
| Backend          | FastAPI, Python               |
| AI / CV          | YOLOv8, OpenCV                |
| Database         | PostgreSQL + PostGIS          |
| Video Streaming  | RTSP, FFmpeg                  |
| Infrastructure   | Docker, Docker Compose        |

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose

### Frontend (Development)
```bash
cd frontend
npm install
npm run dev
```

### Backend (Development)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Full Stack (Docker)
```bash
cp .env.example .env
docker-compose up --build
```

## Project Structure
```
DEP/
├── frontend/          # React + Tailwind dashboard
├── backend/           # FastAPI backend
│   └── app/
│       ├── routers/   # API endpoints
│       ├── models/    # Database models
│       ├── services/  # Business logic
│       └── utils/     # Helpers
├── video-stream/      # Simulated RTSP feed
├── database/          # SQL schemas
└── docker-compose.yml
```
