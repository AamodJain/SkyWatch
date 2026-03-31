import { Plane, Battery, Gauge, MapPin } from 'lucide-react'

export default function DroneCard({ drone, threshold = 100, isCritical = false, onClick, isFocused = false }) {
    const badgeClass = isCritical ? 'critical' : drone.status
    const badgeLabel = isCritical ? 'critical' : drone.status

    return (
        <div
            className={`drone-card ${isFocused ? 'focused' : ''} ${isCritical ? 'critical' : ''}`}
            id={`drone-${drone.id}`}
            onClick={onClick}
        >
            <div className="drone-card-top">
                <div className="drone-name">
                    <Plane size={16} />
                    {drone.name}
                </div>
                <span className={`drone-status-badge ${badgeClass}`}>
                    {badgeLabel}
                </span>
            </div>

            <div className="drone-card-stats">
                <div className="drone-stat">
                    <div className="drone-stat-value">
                        <Battery size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {drone.battery}%
                    </div>
                    <div className="drone-stat-label">Battery</div>
                </div>
                <div className="drone-stat">
                    <div className="drone-stat-value">
                        <Gauge size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {drone.altitude}m
                    </div>
                    <div className="drone-stat-label">Altitude</div>
                </div>
                <div className="drone-stat">
                    <div className="drone-stat-value">
                        <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {threshold}
                    </div>
                    <div className="drone-stat-label">Threshold</div>
                </div>
            </div>
        </div>
    )
}
