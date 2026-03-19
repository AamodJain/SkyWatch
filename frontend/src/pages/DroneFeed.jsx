import { useState, useEffect } from 'react'
import { Video, MapPin, Battery, Users, Activity, BarChart3 } from 'lucide-react'
import { mockDrones } from '../data/mockData'

function parseCSV(text) {
    const lines = text.trim().split('\n')
    return lines.slice(1).map((line) => {
        const vals = line.split(',')
        return {
            frame_index: parseInt(vals[0]),
            headcount: parseInt(vals[1]),
            headcount_density: parseFloat(vals[2]),
        }
    })
}

function getHeatColor(value, maxIntensity) {
    const ratio = Math.min(value / maxIntensity, 1.0)
    const stops = [
        { pos: 0.0, r: 21, g: 101, b: 192 },
        { pos: 0.25, r: 76, g: 175, b: 80 },
        { pos: 0.5, r: 255, g: 235, b: 59 },
        { pos: 0.75, r: 255, g: 152, b: 0 },
        { pos: 1.0, r: 244, g: 67, b: 54 },
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

export default function DroneFeed() {
    const [csvData, setCsvData] = useState([])
    const [currentFrame, setCurrentFrame] = useState(0)
    const maxIntensity = 100
    const liveDroneId = 'DRN-001'

    useEffect(() => {
        fetch('/headcount_data.csv')
            .then((res) => res.text())
            .then((text) => setCsvData(parseCSV(text)))
            .catch((err) => console.error('Failed to load CSV:', err))
    }, [])

    useEffect(() => {
        if (csvData.length === 0) return
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % csvData.length)
        }, 200)
        return () => clearInterval(interval)
    }, [csvData.length])

    const frameData = csvData[currentFrame] || { frame_index: 0, headcount: 0, headcount_density: 0 }

    return (
        <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Live Drone Feeds
            </h2>
            <div className="feed-grid">
                {mockDrones.map((drone) => {
                    const isLive = drone.id === liveDroneId
                    const headcount = isLive ? Math.round(frameData.headcount_density) : drone.peopleCounted

                    return (
                        <div key={drone.id} className="feed-card" id={`feed-${drone.id}`}>
                            <div className="feed-video">
                                {drone.status === 'active' && (
                                    <div className="feed-live-badge">
                                        <span className="feed-live-dot" />
                                        Live
                                    </div>
                                )}
                                {drone.status === 'active' ? (
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
                                        <Video />
                                        <span>
                                            {drone.status === 'idle'
                                                ? `${drone.name} — Standby`
                                                : `${drone.name} — Offline`}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="feed-info">
                                <div className="feed-info-header">
                                    <span className="feed-drone-name">{drone.name}</span>
                                    <span className={`drone-status-badge ${drone.status}`}>
                                        {drone.status}
                                    </span>
                                </div>
                                <div className="feed-location">
                                    <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                                    {drone.zone} · {drone.latitude.toFixed(4)}, {drone.longitude.toFixed(4)}
                                </div>
                                <div className="feed-meta">
                                    <div className="feed-meta-item">
                                        <Battery size={14} />
                                        {drone.battery}%
                                    </div>
                                    <div className="feed-meta-item">
                                        <Users size={14} />
                                        {headcount} detected
                                    </div>
                                </div>

                                {/* Live CSV Data for the live drone */}
                                {isLive && csvData.length > 0 && (
                                    <div className="live-csv-panel" style={{ marginTop: 12 }}>
                                        <h4 style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                                            <BarChart3 size={13} />
                                            Detection Data — Frame {frameData.frame_index}
                                        </h4>
                                        <div className="csv-data-grid">
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Frame</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15 }}>{frameData.frame_index}</span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Peak Pts</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15 }}>{frameData.headcount}</span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Density</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15, color: getHeatColor(frameData.headcount_density, maxIntensity) }}>
                                                    {frameData.headcount_density.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Intensity</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15 }}>
                                                    {(frameData.headcount_density / maxIntensity * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
