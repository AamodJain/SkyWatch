import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mockHeatmapData, mockDrones } from '../data/mockData'
import { X, Video, MapPin, Battery, Users, Activity, BarChart3, SlidersHorizontal } from 'lucide-react'

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Parse CSV data ───────────────────────────────────
function parseCSV(text) {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',')
    return lines.slice(1).map((line) => {
        const vals = line.split(',')
        return {
            frame_index: parseInt(vals[0]),
            headcount: parseInt(vals[1]),
            headcount_density: parseFloat(vals[2]),
        }
    })
}

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

// ─── Heatmap Layer ────────────────────────────────────
function HeatmapLayer({ data }) {
    const map = useMap()
    const heatLayerRef = useRef(null)

    useEffect(() => {
        import('leaflet.heat').then(() => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current)
            }
            heatLayerRef.current = L.heatLayer(data, {
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
        })

        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current)
            }
        }
    }, [map, data])

    return null
}

    // ─── Main Component ───────────────────────────────────
export default function MapView() {
    const center = [28.5900, 77.2200]
    const activeDrones = mockDrones.filter((d) => d.status !== 'offline')
    const [selectedDrone, setSelectedDrone] = useState(null)
    const [liveData, setLiveData] = useState({ headcount: 0, headcount_density: 0, frame_index: 0 })
    const [maxIntensity, setMaxIntensity] = useState(100)
    const [isPlaying, setIsPlaying] = useState(true)

    // Poll actual live API instead of CSV
    useEffect(() => {
        let frameCounter = 0;
        const fetchDensity = async () => {
            if (!isPlaying) return;
            try {
                const res = await fetch('http://localhost:8000/api/density/current');
                if (res.ok) {
                    const data = await res.json();
                    if (data.current_data) {
                        frameCounter++;
                        setLiveData({
                            headcount: data.current_data.points_count,
                            headcount_density: data.current_data.headcount,
                            frame_index: frameCounter
                        });
                    }
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

    // Generate dynamic heatmap data based on the current frame density
    const dynamicHeatmapData = useMemo(() => {
        if (!frameData.headcount_density) return [];

        let points = [];
        const intensity = Math.min(frameData.headcount_density / maxIntensity, 1.0);
        
        activeDrones.forEach(liveDrone => {
            if (liveDrone.status !== 'active') return;
            
            points.push([liveDrone.latitude, liveDrone.longitude, intensity]);
            
            const spreadCount = Math.floor(intensity * 15);
            for(let i=0; i < spreadCount; i++) {
                const latOffset = (Math.random() - 0.5) * 0.003;
                const lngOffset = (Math.random() - 0.5) * 0.003;
                points.push([
                    liveDrone.latitude + latOffset, 
                    liveDrone.longitude + lngOffset, 
                    intensity * 0.8 * Math.random()
                ]);
            }
        });
        
        return points;
    }, [frameData.headcount_density, maxIntensity, activeDrones]);

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
                </div>
            </div>

            <MapContainer center={center} zoom={12} className="leaflet-map" zoomControl={true}>
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <HeatmapLayer data={dynamicHeatmapData} />
                {activeDrones.map((drone) => {
                    const isLiveDrone = drone.status === 'active'
                    const headcount = isLiveDrone ? frameData.headcount_density : drone.peopleCounted
                    const color = getHeatColor(headcount, maxIntensity)
                    const densityLabel = getDensityLabel(headcount, maxIntensity)
                    const radius = isLiveDrone ? 16 + (headcount / maxIntensity) * 10 : 14

                    return (
                        <CircleMarker
                            key={drone.id}
                            center={[drone.latitude, drone.longitude]}
                            radius={radius}
                            pathOptions={{
                                fillColor: color,
                                fillOpacity: 0.85,
                                color: 'white',
                                weight: 2,
                            }}
                            eventHandlers={{
                                click: () => setSelectedDrone(drone),
                            }}
                        >
                            <Popup>
                                <div style={{ color: '#1a1f36', fontSize: '13px', lineHeight: 1.6 }}>
                                    <strong>{drone.name}</strong> ({drone.id})<br />
                                    Zone: {drone.zone}<br />
                                    Altitude: {drone.altitude}m<br />
                                    People: {isLiveDrone ? Math.round(headcount) : drone.peopleCounted}<br />
                                    Density: <strong style={{ color }}>{densityLabel}</strong><br />
                                    Battery: {drone.battery}%
                                </div>
                            </Popup>
                        </CircleMarker>
                    )
                })}
            </MapContainer>

            {/* ─── Max Intensity Slider ─── */}
            <div className="intensity-slider-container">
                <div className="intensity-slider-header">
                    <SlidersHorizontal size={14} />
                    <span>Max Intensity</span>
                    <span className="intensity-value">{maxIntensity}</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="500"
                    value={maxIntensity}
                    onChange={(e) => setMaxIntensity(Number(e.target.value))}
                    className="intensity-slider"
                    id="max-intensity-slider"
                />
                <div className="intensity-labels">
                    <span>10</span>
                    <span>500</span>
                </div>
            </div>

            {/* ─── Playback Controls ─── */}
            {/* ─── Live Data Badge ─── */}
            <div className="playback-controls">
                <span className="frame-label">
                    Live F{frameData.frame_index} | {Math.round(frameData.headcount_density)} ppl
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

            {/* ─── Drone Feed Modal ─── */}
            {selectedDrone && (
                <div className="drone-feed-modal-overlay" onClick={() => setSelectedDrone(null)}>
                    <div className="drone-feed-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="drone-feed-modal-header">
                            <h3>{selectedDrone.name} Live Feed</h3>
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
                                {selectedDrone.status === 'active' ? (
                                    <video
                                        className="feed-video-player"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    >
                                        <source src="http://localhost:5173/droneVid.mp4" type="video/mp4" />
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
                                    Drone Information
                                </h4>
                                <div className="detail-item">
                                    <span className="detail-label">ID:</span>
                                    <span>{selectedDrone.id}</span>
                                </div>
                                <div className="detail-item">
                                    <MapPin size={14} />
                                    <span>{selectedDrone.zone}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Coordinates:</span>
                                    <span>{selectedDrone.latitude.toFixed(4)}, {selectedDrone.longitude.toFixed(4)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Altitude:</span>
                                    <span>{selectedDrone.altitude}m</span>
                                </div>
                                <div className="detail-item">
                                    <Users size={14} />
                                    <span>
                                        {selectedDrone.status === 'active'
                                            ? `${Math.round(frameData.headcount_density)} people detected`
                                            : `${selectedDrone.peopleCounted} people detected`}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <Battery size={14} />
                                    <span>{selectedDrone.battery}%</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                            background:
                                                selectedDrone.status === 'active'
                                                    ? 'rgba(16, 185, 129, 0.15)'
                                                    : selectedDrone.status === 'idle'
                                                        ? 'rgba(245, 158, 11, 0.15)'
                                                        : 'rgba(100, 116, 139, 0.15)',
                                            color:
                                                selectedDrone.status === 'active'
                                                    ? '#10b981'
                                                    : selectedDrone.status === 'idle'
                                                        ? '#f59e0b'
                                                        : '#64748b',
                                        }}
                                    >
                                        {selectedDrone.status}
                                    </span>
                                </div>

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
                                                <span className="csv-stat-value">{frameData.headcount}</span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Density Count</span>
                                                <span className="csv-stat-value" style={{
                                                    color: getHeatColor(frameData.headcount_density, maxIntensity)
                                                }}>
                                                    {frameData.headcount_density.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Intensity</span>
                                                <span className="csv-stat-value">
                                                    {getDensityLabel(frameData.headcount_density, maxIntensity)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mini history bar chart removed for live stream */}
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
