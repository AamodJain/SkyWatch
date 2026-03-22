# SkyWatch – Drone Surveillance Portal

Real-time crowd-density monitoring using drone video streams, CV-based person detection, FastAPI APIs, and a React + Leaflet dashboard.

## Local Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

---

## 1) Run Backend (FastAPI)

From project root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:

- API root: http://localhost:8000
- Health: http://localhost:8000/health

---

## 2) Run Frontend (Vite + React)

Open a new terminal, from project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at:

- http://localhost:5173

---

## 3) Run Drone Video Streaming Processor

Open a new terminal, from project root:

```bash
cd drone_heatmap_backend
source ../backend/venv/bin/activate
```

### Start a single stream

```bash
python3 stream_processor.py \
       --source ../media/videos/droneVid.mp4 \
       --fps 5 \
       --drone-id DRN-001 \
       --drone-name Alpha-1 \
       --zone "Live Stream Zone" \
       --latitude 28.6139 \
       --longitude 77.2090 \
       --altitude 100 \
       --loop true
```

### Start a second stream (parallel terminal)

```bash
cd /home/vikash-mehra/Tree/Drone/SkyWatch/drone_heatmap_backend
source ../backend/venv/bin/activate
python3 stream_processor.py \
       --source /home/vikash-mehra/Tree/Drone/SkyWatch/media/videos/droneVid2.mp4 \
       --fps 5 \
       --drone-id DRN-002 \
       --drone-name Bravo-2 \
       --zone "India Gate" \
       --latitude 28.5921 \
       --longitude 77.2315 \
       --altitude 85 \
       --loop true
```

> Run one `stream_processor.py` per drone feed in separate terminals.

---

## Typical Run Order

1. Start backend
2. Start frontend
3. Start one or more stream processors
4. Open dashboard at http://localhost:5173

---

## Useful Notes

- Video files are served from `media/videos` via backend `/videos/*` routes.
- Stream defaults are centralized in `drone_heatmap_backend/stream_config.py`.
- Loop behavior is controlled with `--loop true|false`.
- If no live stream is active, drone cards may appear idle unless debug playback mode is enabled.

---

## Project Layout

```text
SkyWatch/
├── backend/                # FastAPI app
├── frontend/               # React dashboard
├── drone_heatmap_backend/  # Stream processing + detection pipeline
├── media/videos/           # Source mp4 files for local streams
├── database/               # SQL bootstrap
└── docker-compose.yml
```
