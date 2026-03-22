import { useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, Video, BarChart3, SlidersHorizontal } from 'lucide-react'

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Color interpolation based on intensity ───────────
function getHeatColor(value, maxIntensity) {
    const ratio = Math.min(value / maxIntensity, 1.0)
    // 5 stops: blue → green → yellow → orange → red
    const stops = [
        { pos: 0.0, r: 21, g: 101, b: 192 },   // #1565c0 - blue
        { pos: 0.25, r: 76, g: 175, b: 80 },    // #4caf50 - green
        { pos: 0.5, r: 255, g: 235, b: 59 },    // #ffeb3b - yellow
        { pos: 0.75, r: 255, g: 152, b: 0 },     // #ff9800 - orange
        { pos: 1.0, r: 244, g: 67, b: 54 },      // #f44336 - red
    ]
    let lower = stops[0], upper = stops[stops.length - 1]
    for (let i = 0; i < stops.length - 1; i++) {
        if (ratio >= stops[i].pos && ratio <= stops[i + 1].pos) {
            lower = stops[i]
            upper = stops[i + 1]
            break
        }
    }
    const range = upper.pos - lower.pos || 1
    const t = (ratio - lower.pos) / range
    const r = Math.round(lower.r + (upper.r - lower.r) * t)
    const g = Math.round(lower.g + (upper.g - lower.g) * t)
    const b = Math.round(lower.b + (upper.b - lower.b) * t)
    return `rgb(${r},${g},${b})`
}

function getDensityLabel(value, maxIntensity) {
    const ratio = value / maxIntensity
    if (ratio >= 0.8) return 'Critical'
    if (ratio >= 0.6) return 'Very High'
    if (ratio >= 0.4) return 'High'
    if (ratio >= 0.2) return 'Moderate'
    return 'Low'
}

function getDroneViewAngle(drone) {
    return Math.max(10, Math.min(170, Number(drone.viewAngle ?? 60)))
}

function getDroneFootprintRadiusMeters(drone) {
    const altitudeMeters = Math.max(1, Number(drone.altitude ?? 100))
    const viewAngleDeg = getDroneViewAngle(drone)
    return altitudeMeters * Math.tan((viewAngleDeg * Math.PI) / 360)
}

function getVideoNameFromUrl(url) {
    try {
        const parsed = new URL(url)
        return parsed.pathname.split('/').pop() || ''
    } catch {
        return (url || '').split('/').pop() || ''
    }
}

// ─── Heatmap Layer ────────────────────────────────────
function HeatmapLayer({ data }) {
    const map = useMap()
    const heatLayerRef = useRef(null)
    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    useEffect(() => {
        import('leaflet.heat').then(() => {
            if (!isMountedRef.current || heatLayerRef.current) return

            heatLayerRef.current = L.heatLayer([], {
                radius: 35,
                blur: 25,
                maxZoom: 17,
                max: 1.0,
                gradient: {
                    0.1: '#1a237e',
                    0.2: '#283593',
                    0.3: '#1565c0',
                    0.4: '#0288d1',
                    0.5: '#00acc1',
                    0.6: '#4caf50',
                    0.7: '#8bc34a',
                    0.8: '#ffeb3b',
                    0.9: '#ff9800',
                    1.0: '#f44336',
                },
            }).addTo(map)

            const heatContainer = heatLayerRef.current.getContainer?.()
            if (heatContainer) {
                // Let map interactions pass through heat layer canvas.
                heatContainer.style.pointerEvents = 'none'
            }

            heatLayerRef.current.setLatLngs(data)
            heatLayerRef.current.redraw()
        })
    }, [map])

    useEffect(() => {
        if (!heatLayerRef.current) return
        heatLayerRef.current.setLatLngs(data)
        heatLayerRef.current.redraw()
    }, [data])

    useEffect(() => {
        const forceRedraw = () => {
            if (!heatLayerRef.current) return
            heatLayerRef.current.redraw()
        }

        map.on('move', forceRedraw)
        map.on('zoom', forceRedraw)

        return () => {
            map.off('move', forceRedraw)
            map.off('zoom', forceRedraw)
        }
    }, [map])

    useEffect(() => {
        return () => {
            if (!heatLayerRef.current) return
            map.removeLayer(heatLayerRef.current)
            heatLayerRef.current = null
        }
    }, [map])

    return null
}

function MapFocusController({ targetDrone, focusRequestId }) {
    const map = useMap()

    useEffect(() => {
        if (!targetDrone?.id || focusRequestId <= 0) return

        const lat = Number(targetDrone.latitude)
        const lng = Number(targetDrone.longitude)
        if (Number.isNaN(lat) || Number.isNaN(lng)) return

        map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.9 })
    }, [map, focusRequestId, targetDrone?.id, targetDrone?.latitude, targetDrone?.longitude])

    return null
}

    // ─── Main Component ───────────────────────────────────
export default function MapView({
    focusedDroneId = null,
    focusRequestId = 0,
    maxIntensityByDrone = {},
    setMaxIntensityByDrone = () => {},
}) {
    const defaultCenter = [28.5900, 77.2200]
    const detailsPanelRef = useRef(null)
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const [drones, setDrones] = useState([])
    const activeDrones = drones.filter((d) => d.status === 'active' || d.status === 'debug')
    const center = activeDrones.length > 0
        ? [Number(activeDrones[0].latitude || defaultCenter[0]), Number(activeDrones[0].longitude || defaultCenter[1])]
        : defaultCenter
    const [selectedDrone, setSelectedDrone] = useState(null)
    const [liveData, setLiveData] = useState({ headcount: 0, headcount_density: 0, frame_index: 0 })
    const [streamMetricsByVideo, setStreamMetricsByVideo] = useState({})
    const [showDensitySettings, setShowDensitySettings] = useState(false)
    const [isPlaying, setIsPlaying] = useState(true)
    const [loopVideo, setLoopVideo] = useState(true)
    const [isDraggingDetails, setIsDraggingDetails] = useState(false)
    const [detailsPanelPosition, setDetailsPanelPosition] = useState({ x: 18, y: 92 })
    const debugPlayback = new URLSearchParams(window.location.search).get('debugPlayback') === '1'
    const focusedDrone = useMemo(
        () => drones.find((d) => d.id === focusedDroneId) || null,
        [drones, focusedDroneId]
    )

    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/drones/?include_debug=${debugPlayback}`)
                if (res.ok) {
                    const data = await res.json()
                    setDrones(data.drones || [])
                }
            } catch (err) {
                console.error('Error fetching live streams', err)
            }
        }

        fetchDrones()
        const interval = setInterval(fetchDrones, 1000)
        return () => clearInterval(interval)
    }, [])

    // Poll actual live API instead of CSV
    useEffect(() => {
        let frameCounter = 0;
        const fetchDensity = async () => {
            if (!isPlaying) return;
            try {
                const res = await fetch('http://localhost:8000/api/density/current');
                if (res.ok) {
                    const data = await res.json();
                    const streams = data.active_streams || {}
                    const byVideo = {}
                    let totalPoints = 0
                    let totalHeadcount = 0
                    let anyLoopTrue = false

                    Object.entries(streams).forEach(([source, stream]) => {
                        const videoName = getVideoNameFromUrl(source)
                        if (!videoName) return
                        byVideo[videoName] = stream
                        totalPoints += Number(stream?.points_count || 0)
                        totalHeadcount += Number(stream?.headcount || 0)
                        anyLoopTrue = anyLoopTrue || stream?.loop_video !== false
                    })

                    frameCounter++;
                    setStreamMetricsByVideo(byVideo)
                    setLoopVideo(Object.keys(byVideo).length > 0 ? anyLoopTrue : (data.current_data?.loop_video !== false));
                    setLiveData({
                        headcount: totalPoints,
                        headcount_density: totalHeadcount,
                        frame_index: frameCounter
                    });
                }
            } catch (err) {
                console.error("Error fetching live density", err);
            }
        };

        fetchDensity();
        const interval = setInterval(fetchDensity, 1000); // refresh every 1s
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Use liveData as frameData
    const frameData = liveData;

    useEffect(() => {
        if (!isDraggingDetails) return

        const handleMouseMove = (event) => {
            const panelWidth = detailsPanelRef.current?.offsetWidth || 420
            const panelHeight = detailsPanelRef.current?.offsetHeight || 520

            let nextX = event.clientX - dragOffsetRef.current.x
            let nextY = event.clientY - dragOffsetRef.current.y

            nextX = Math.max(8, Math.min(nextX, window.innerWidth - panelWidth - 8))
            nextY = Math.max(8, Math.min(nextY, window.innerHeight - panelHeight - 8))

            setDetailsPanelPosition({ x: nextX, y: nextY })
        }

        const handleMouseUp = () => setIsDraggingDetails(false)

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDraggingDetails])

    const startDraggingDetails = (event) => {
        if (!detailsPanelRef.current) return
        const panelRect = detailsPanelRef.current.getBoundingClientRect()
        dragOffsetRef.current = {
            x: event.clientX - panelRect.left,
            y: event.clientY - panelRect.top,
        }
        setIsDraggingDetails(true)
    }

    const selectedDroneMetrics = useMemo(() => {
        if (!selectedDrone?.video_url) return null
        const videoName = getVideoNameFromUrl(selectedDrone.video_url)
        return streamMetricsByVideo[videoName] || null
    }, [selectedDrone, streamMetricsByVideo])

    const getDroneMaxIntensity = (drone) => {
        if (!drone?.id) return 100
        return Number(maxIntensityByDrone[drone.id] ?? 100)
    }

    const settingsDrone = selectedDrone || focusedDrone || activeDrones[0] || null
    const settingsDroneLimit = settingsDrone ? getDroneMaxIntensity(settingsDrone) : 100

    // Generate dynamic heatmap data based on the current frame density
    const dynamicHeatmapData = useMemo(() => {
        if (!frameData.headcount_density) return [];

        const points = [];
        
        activeDrones.forEach(liveDrone => {
            if (liveDrone.status !== 'active' && liveDrone.status !== 'debug') return;
            
            const metrics = streamMetricsByVideo[getVideoNameFromUrl(liveDrone.video_url)]
            const streamHeadcount = Number(metrics?.headcount ?? liveDrone.headcountDensity ?? 0)
            if (streamHeadcount <= 0) return

            const baseLat = Number(liveDrone.latitude || center[0]);
            const baseLng = Number(liveDrone.longitude || center[1]);
            const footprintRadiusMeters = getDroneFootprintRadiusMeters(liveDrone)
            const droneMaxIntensity = getDroneMaxIntensity(liveDrone)
            const intensity = Math.min(streamHeadcount / droneMaxIntensity, 1.0)
            const latRad = (baseLat * Math.PI) / 180
            const metersPerDegLat = 111320
            const metersPerDegLng = 111320 * Math.max(0.2, Math.cos(latRad))

            points.push([baseLat, baseLng, intensity]);

            // Deterministic footprint points inside the drone coverage circle.
            // This avoids jitter and keeps the heatmap stable when the drone is still.
            const spreadCount = Math.max(10, Math.floor(intensity * 22));
            const goldenAngle = Math.PI * (3 - Math.sqrt(5))

            for (let i = 0; i < spreadCount; i++) {
                const t = (i + 1) / spreadCount
                const radiusMeters = footprintRadiusMeters * Math.sqrt(t)
                const angle = i * goldenAngle

                const northMeters = radiusMeters * Math.cos(angle)
                const eastMeters = radiusMeters * Math.sin(angle)

                const latOffset = northMeters / metersPerDegLat
                const lngOffset = eastMeters / metersPerDegLng

                points.push([
                    baseLat + latOffset,
                    baseLng + lngOffset,
                    Math.max(0.08, intensity * (1 - t * 0.7))
                ]);
            }
        });
        
        return points;
    }, [frameData.headcount_density, activeDrones, center, streamMetricsByVideo, maxIntensityByDrone]);

    return (
        <div className="map-container">
            <div className="map-header">
                <div>
                    <div className="map-header-title">Live Heatmap View</div>
                    <div className="map-header-subtitle">
                        Real-time crowd density overlay · {activeDrones.length} active drones
                        <span style={{ marginLeft: 12, color: '#10b981' }}>
                            · Live Frame {frameData.frame_index}
                        </span>
                    </div>
                </div>
                <div className="map-controls">
                    <button className="map-control-btn active" id="heatmap-toggle">Heatmap</button>
                    <button className="map-control-btn" id="satellite-toggle">Satellite</button>
                    <button className="map-control-btn" id="markers-toggle">Markers</button>
                    <button
                        className="map-control-btn"
                        onClick={() => setShowDensitySettings((prev) => !prev)}
                    >
                        Density Settings
                    </button>
                </div>
            </div>

            <MapContainer
                center={center}
                zoom={12}
                className="leaflet-map"
                zoomControl={true}
                preferCanvas={true}
                zoomAnimation={false}
                fadeAnimation={false}
                markerZoomAnimation={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <MapFocusController targetDrone={focusedDrone} focusRequestId={focusRequestId} />
                <HeatmapLayer data={dynamicHeatmapData} />
                {activeDrones.map((drone) => {
                    const isLiveDrone = drone.status === 'active' || drone.status === 'debug'
                    const metrics = streamMetricsByVideo[getVideoNameFromUrl(drone.video_url)]
                    const headcount = isLiveDrone ? Number(metrics?.headcount ?? drone.headcountDensity ?? 0) : drone.peopleCounted
                    const droneMaxIntensity = getDroneMaxIntensity(drone)
                    const color = getHeatColor(headcount, droneMaxIntensity)
                    const densityLabel = getDensityLabel(headcount, droneMaxIntensity)

                    // Ground footprint for vertical camera view:
                    // radius = altitude * tan(FOV/2)
                    // altitude in meters, FOV in degrees.
                    const viewAngleDeg = getDroneViewAngle(drone)
                    const footprintRadiusMeters = getDroneFootprintRadiusMeters(drone)

                    return (
                        <Circle
                            key={drone.id}
                            center={[drone.latitude, drone.longitude]}
                            radius={footprintRadiusMeters}
                            pathOptions={{
                                fillColor: color,
                                fillOpacity: 0.28,
                                stroke: false,
                            }}
                            eventHandlers={{
                                click: () => setSelectedDrone(drone),
                            }}
                        >
                            <Popup>
                                <div style={{ color: '#1a1f36', fontSize: '13px', lineHeight: 1.6 }}>
                                    <strong>{drone.name}</strong> ({drone.id})<br />
                                    Zone: {drone.zone || 'Live Stream Zone'}<br />
                                    Altitude: {drone.altitude ?? 100}m<br />
                                    View Angle: {viewAngleDeg}°<br />
                                    Coverage Radius: {Math.round(footprintRadiusMeters)}m<br />
                                    People: {Math.round(headcount || 0)}<br />
                                    Density: <strong style={{ color }}>{densityLabel}</strong><br />
                                    Battery: {drone.battery ?? 100}%
                                </div>
                            </Popup>
                        </Circle>
                    )
                })}
            </MapContainer>

            {/* ─── Max Intensity Slider ─── */}
            {showDensitySettings && (
                <div className="intensity-slider-container">
                    <div className="intensity-slider-header">
                        <SlidersHorizontal size={14} />
                        <span>
                            Max Intensity{settingsDrone ? ` · ${settingsDrone.name}` : ''}
                        </span>
                        <span className="intensity-value">{settingsDroneLimit}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="500"
                        value={settingsDroneLimit}
                        onChange={(e) => {
                            if (!settingsDrone?.id) return
                            const nextVal = Number(e.target.value)
                            setMaxIntensityByDrone((prev) => ({
                                ...prev,
                                [settingsDrone.id]: nextVal,
                            }))
                        }}
                        className="intensity-slider"
                        id="max-intensity-slider"
                    />
                    <div className="intensity-labels">
                        <span>10</span>
                        <span>500</span>
                    </div>
                </div>
            )}

            {/* ─── Playback Controls ─── */}
            {/* ─── Live Data Badge ─── */}
            <div className="playback-controls">
                <span className="frame-label">
                    Live F{frameData.frame_index} | {Math.round(frameData.headcount_density)} total ppl
                </span>
            </div>

            {/* ─── Legend ─── */}
            <div className="map-legend">
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Density:</span>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#1565c0' }} />
                    Low
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#4caf50' }} />
                    Moderate
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#ffeb3b' }} />
                    High
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#ff9800' }} />
                    Very High
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#f44336' }} />
                    Critical
                </div>
            </div>

            {/* ─── Draggable Drone Details Panel ─── */}
            {selectedDrone && (
                <div
                    ref={detailsPanelRef}
                    className="drone-feed-floating-panel"
                    style={{ left: detailsPanelPosition.x, top: detailsPanelPosition.y }}
                >
                    <div className="drone-feed-modal">
                        <div className="drone-feed-modal-header">
                            <h3
                                style={{ cursor: 'move', userSelect: 'none' }}
                                onMouseDown={startDraggingDetails}
                                title="Drag to move"
                            >
                                {selectedDrone.name} Live Feed
                            </h3>
                            <button
                                className="drone-feed-modal-close"
                                onClick={() => setSelectedDrone(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    fontSize: '20px',
                                    padding: '4px',
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="drone-feed-modal-content">
                            <div className="feed-video">
                                {selectedDrone.status === 'active' && (
                                    <div className="feed-live-badge">
                                        <span className="feed-live-dot" />
                                        Live
                                    </div>
                                )}
                                {selectedDrone.status === 'debug' && (
                                    <div className="feed-live-badge" style={{ background: '#7c3aed', color: '#ede9fe' }}>
                                        Debug Playback
                                    </div>
                                )}
                                {(selectedDrone.status === 'active' || selectedDrone.status === 'debug') ? (
                                    <video
                                        className="feed-video-player"
                                        autoPlay
                                        muted
                                        loop={loopVideo}
                                        playsInline
                                    >
                                        <source src={selectedDrone.video_url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="feed-video-placeholder">
                                        <Video size={48} />
                                        <span>
                                            {selectedDrone.status === 'idle'
                                                ? `${selectedDrone.name} — Standby`
                                                : `${selectedDrone.name} — Offline`}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="drone-feed-details">
                                <h4 style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>
                                    Live Analytics
                                </h4>

                                {/* ─── Live CSV Data Panel ─── */}
                                {selectedDrone.status === 'active' && (
                                    <div className="live-csv-panel">
                                        <h4 style={{ margin: '16px 0 10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <BarChart3 size={14} />
                                            Real-Time Detection Data
                                        </h4>
                                        <div className="csv-data-grid">
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Frame</span>
                                                <span className="csv-stat-value">{frameData.frame_index}</span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Peak Points</span>
                                                <span className="csv-stat-value">{Number(selectedDroneMetrics?.points_count ?? selectedDrone.peopleCounted ?? 0)}</span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Density Count</span>
                                                <span className="csv-stat-value" style={{
                                                    color: getHeatColor(
                                                        Number(selectedDroneMetrics?.headcount ?? selectedDrone.headcountDensity ?? 0),
                                                        getDroneMaxIntensity(selectedDrone)
                                                    )
                                                }}>
                                                    {Number(selectedDroneMetrics?.headcount ?? selectedDrone.headcountDensity ?? 0).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Intensity</span>
                                                <span className="csv-stat-value">
                                                    {getDensityLabel(
                                                        Number(selectedDroneMetrics?.headcount ?? selectedDrone.headcountDensity ?? 0),
                                                        getDroneMaxIntensity(selectedDrone)
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mini history bar chart removed for live stream */}
                                    </div>
                                )}

                                {selectedDrone.status !== 'active' && (
                                    <div className="detail-item">
                                        <span style={{ color: '#94a3b8' }}>
                                            Detailed metadata is available in the map popup.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
