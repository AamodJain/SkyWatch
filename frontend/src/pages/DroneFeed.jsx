import { Video, MapPin, Battery, Users } from 'lucide-react'
import { mockDrones } from '../data/mockData'

export default function DroneFeed() {
    return (
        <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Live Drone Feeds
            </h2>
            <div className="feed-grid">
                {mockDrones.map((drone) => (
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
                                    {drone.peopleCounted} detected
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
