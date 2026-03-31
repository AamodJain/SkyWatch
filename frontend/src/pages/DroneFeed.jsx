import { useState, useEffect } from 'react'
import { Video, MapPin, Battery, Users, Activity, BarChart3 } from 'lucide-react'

function getVideoNameFromUrl(url) {
    try {
        const parsed = new URL(url)
        return parsed.pathname.split('/').pop() || ''
    } catch {
        return (url || '').split('/').pop() || ''
    }
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
    const [drones, setDrones] = useState([])
    const [liveData, setLiveData] = useState({ points_count: 0, headcount: 0, timestamp: null })
    const [streamMetricsByVideo, setStreamMetricsByVideo] = useState({})
    const [frameIndex, setFrameIndex] = useState(0)
    const maxIntensity = 100
    const debugPlayback = new URLSearchParams(window.location.search).get('debugPlayback') === '1'

    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/drones/?include_debug=${debugPlayback}`)
                if (res.ok) {
                    const data = await res.json()
                    setDrones(data.drones || [])
                }
            } catch (err) {
                console.error('Failed to load live streams:', err)
            }
        }

        fetchDrones()
        const interval = setInterval(fetchDrones, 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const fetchDensity = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/density/current')
                if (res.ok) {
                    const data = await res.json()
                    const streams = data.active_streams || {}
                    const byVideo = {}
                    let totalPoints = 0
                    let totalHeadcount = 0

                    Object.entries(streams).forEach(([source, stream]) => {
                        const videoName = getVideoNameFromUrl(source)
                        if (!videoName) return
                        byVideo[videoName] = stream
                        totalPoints += Number(stream?.points_count || 0)
                        totalHeadcount += Number(stream?.headcount || 0)
                    })

                    setStreamMetricsByVideo(byVideo)
                    setLiveData({
                        points_count: totalPoints,
                        headcount: totalHeadcount,
                        timestamp: data.current_data?.timestamp || null,
                    })
                    setFrameIndex((prev) => prev + 1)
                }
            } catch (err) {
                console.error('Failed to load live density:', err)
            }
        }

        fetchDensity()
        const interval = setInterval(() => {
            fetchDensity()
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const frameData = {
        frame_index: frameIndex,
        headcount: liveData.points_count || 0,
        headcount_density: liveData.headcount || 0,
    }

    return (
        <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Live Drone Feeds
            </h2>
            {drones.length === 0 && (
                <div className="feed-card" style={{ padding: 16, marginBottom: 16 }}>
                    No active live streams found. Start the stream processor to publish live data.
                    {!debugPlayback && (
                        <span style={{ display: 'block', marginTop: 8, color: '#94a3b8' }}>
                            For quick UI debugging, open this page with <strong>?debugPlayback=1</strong>.
                        </span>
                    )}
                </div>
            )}
            <div className="feed-grid">
                {drones.map((drone) => {
                    const isLive = drone.status === 'active' || drone.status === 'debug'
                    const streamMetrics = streamMetricsByVideo[getVideoNameFromUrl(drone.video_url)] || {}
                    const dronePeakPoints = Number(streamMetrics.points_count ?? drone.peopleCounted ?? 0)
                    const droneDensity = Number(streamMetrics.headcount ?? drone.headcountDensity ?? 0)
                    const headcount = Math.round(dronePeakPoints)
                    const loopVideo = streamMetrics.loop_video !== false

                    return (
                        <div key={drone.id} className="feed-card" id={`feed-${drone.id}`}>
                            <div className="feed-video">
                                {drone.status === 'active' && (
                                    <div className="feed-live-badge">
                                        <span className="feed-live-dot" />
                                        Live
                                    </div>
                                )}
                                {drone.status === 'debug' && (
                                    <div className="feed-live-badge" style={{ background: '#7c3aed', color: '#ede9fe' }}>
                                        Debug Playback
                                    </div>
                                )}
                                {(drone.status === 'active' || drone.status === 'debug') ? (
                                    <video
                                        className="feed-video-player"
                                        autoPlay
                                        muted
                                        loop={loopVideo}
                                        playsInline
                                    >
                                        <source src={drone.video_url} type="video/mp4" />
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
                                    {drone.zone || 'Live Stream Zone'} · {Number(drone.latitude || 0).toFixed(4)}, {Number(drone.longitude || 0).toFixed(4)}
                                </div>
                                <div className="feed-meta">
                                    <div className="feed-meta-item">
                                        <Battery size={14} />
                                        {drone.battery ?? 100}%
                                    </div>
                                    <div className="feed-meta-item">
                                        <Users size={14} />
                                        {headcount} detected
                                    </div>
                                </div>

                                {isLive && (
                                    <div className="live-csv-panel" style={{ marginTop: 12 }}>
                                        <h4 style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                                            <BarChart3 size={13} />
                                            Detection Data — Frame {frameData.frame_index || 0}
                                        </h4>
                                        <div className="csv-data-grid">
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Frame</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15 }}>{frameData.frame_index}</span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Peak Pts</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15 }}>{dronePeakPoints}</span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Density</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15, color: getHeatColor(droneDensity, maxIntensity) }}>
                                                    {Number(droneDensity || 0).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="csv-stat">
                                                <span className="csv-stat-label">Intensity</span>
                                                <span className="csv-stat-value" style={{ fontSize: 15 }}>
                                                    {(Number(droneDensity || 0) / maxIntensity * 100).toFixed(0)}%
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
