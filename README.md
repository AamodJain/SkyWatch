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
 .\venv\Scripts\Activate.ps1
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
- http://localhost:5173/?debugPlayback=1 (for Debug Mode)
---

## 3) Run Drone Video Streaming Processor

Open a new terminal, from project root:

```bash
cd drone_heatmap_backend
..\backend\venv\Scripts\Activate.ps1  
python stream_processor.py --source "..\media\videos\droneVid.mp4" --fps 5 --drone-id DRN-001 --drone-name Alpha-1 --zone "India Gate" --latitude 28.6139 --longitude 77.2090 --altitude 100 --loop true --model sdnet
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

### IIT Ropar
python3 stream_processor.py \
       --source ../media/videos/droneVid2.mp4 \
       --fps 5 \
       --drone-id DRN-004 \
       --drone-name Alpha-4 \
       --zone "Live Stream Zone" \
       --latitude 30.9683 \
       --longitude 76.4732 \
       --altitude 100 \
       --loop true




python3 stream_processor.py \
       --source ../media/videos/droneVid3.mp4 \
       --fps 5 \
       --drone-id DRN-0014 \
       --drone-name Alpha-6 \
       --zone "Live Stream Zone" \
      --latitude 28.7139 \
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

### Live URL (RTSP / RTMP / HTTP) — real drone feed

Just pass the live URL as `--source`. The processor automatically detects it is a network stream
and enables auto-reconnect (no looping, infinite retries by default):

```bash
# RTSP from a DJI / Parrot-style drone
python3 stream_processor.py \
       --source rtsp://192.168.1.10:554/live \
       --fps 5 \
       --drone-id DRN-LIVE-01 \
       --drone-name "DJI Mavic 3" \
       --zone "Campus Perimeter" \
       --latitude 30.9683 \
       --longitude 76.4732 \
       --altitude 80

# RTMP stream
python3 stream_processor.py \
       --source rtmp://live.example.com/live/stream-key \
       --fps 5 \
       --drone-id DRN-RTMP-01 \
       --drone-name "RTMP Drone" \
       --latitude 28.6139 --longitude 77.2090 --altitude 100

# HTTP MJPEG (some IP cameras / GCS software output this)
python3 stream_processor.py \
       --source http://192.168.1.20:8080/video \
       --fps 5 \
       --drone-id DRN-HTTP-01 \
       --drone-name "IP-Cam Drone" \
       --latitude 28.6139 --longitude 77.2090 --altitude 60
```

**Key differences vs local files:**
- `--loop` is ignored for live URLs (always false).
- The processor auto-reconnects with exponential back-off (3 s → 6 s → … → 30 s max) when the stream drops.
- Use `--max-reconnect-attempts N` to cap retries (default: 0 = infinite).
- RTSP/RTMP feeds show a "Live Stream Active" placeholder in the dashboard
  (browsers cannot play these protocols natively); HTTP-MJPEG and HLS streams play inline.

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
- Model selection for crowd density can be switched with `--model` (e.g. `sdnet` or `yolo`).
- For SDNet, model path auto-detects the first `.pth` in `MovingDroneCrowd` if `--model-path` is omitted.
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
