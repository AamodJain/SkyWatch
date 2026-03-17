import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mockHeatmapData, mockDrones } from '../data/mockData'
import { X, Video, MapPin, Battery, Users } from 'lucide-react'

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom drone icon
const droneIcon = (status) =>
    L.divIcon({
        className: '',
        html: `<div style="
      width: 28px;
      height: 28px;
      background: ${status === 'active' ? '#10b981' : status === 'idle' ? '#f59e0b' : '#64748b'};
      border: 3px solid ${status === 'active' ? '#059669' : status === 'idle' ? '#d97706' : '#475569'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 12px ${status === 'active' ? 'rgba(16,185,129,0.5)' : 'rgba(0,0,0,0.3)'};
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    })

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

export default function MapView() {
    const center = [28.5900, 77.2200]
    const activeDrones = mockDrones.filter((d) => d.status !== 'offline')
    const [selectedDrone, setSelectedDrone] = useState(null)

    return (
        <div className="map-container">
            <div className="map-header">
                <div>
                    <div className="map-header-title">Live Heatmap View</div>
                    <div className="map-header-subtitle">
                        Real-time crowd density overlay · {activeDrones.length} active drones
                    </div>
                </div>
                <div className="map-controls">
                    <button className="map-control-btn active" id="heatmap-toggle">Heatmap</button>
                    <button className="map-control-btn" id="satellite-toggle">Satellite</button>
                    <button className="map-control-btn" id="markers-toggle">Markers</button>
                </div>
            </div>

            <MapContainer
                center={center}
                zoom={12}
                className="leaflet-map"
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <HeatmapLayer data={mockHeatmapData} />
                {activeDrones.map((drone) => {
                    const markerRef = useRef(null)
                    return (
                        <Marker
                            key={drone.id}
                            position={[drone.latitude, drone.longitude]}
                            icon={droneIcon(drone.status)}
                            ref={markerRef}
                            eventHandlers={{
                                mouseover: () => markerRef.current?.openPopup(),
                                mouseout: () => markerRef.current?.closePopup(),
                                click: () => setSelectedDrone(drone),
                            }}
                        >
                            <Popup>
                                <div style={{ color: '#1a1f36', fontSize: '13px', lineHeight: 1.6 }}>
                                    <strong>{drone.name}</strong> ({drone.id})<br />
                                    Zone: {drone.zone}<br />
                                    Altitude: {drone.altitude}m<br />
                                    People: {drone.peopleCounted}<br />
                                    Battery: {drone.battery}%
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>

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
                                        <source src="/droneVid.mp4" type="video/mp4" />
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
                                    <span>{selectedDrone.peopleCounted} people detected</span>
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
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
