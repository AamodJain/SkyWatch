import { Plane, Battery, Gauge, MapPin } from 'lucide-react'

export default function DroneCard({ drone }) {
    return (
        <div className="drone-card" id={`drone-${drone.id}`}>
            <div className="drone-card-top">
                <div className="drone-name">
                    <Plane size={16} />
                    {drone.name}
                </div>
                <span className={`drone-status-badge ${drone.status}`}>
                    {drone.status}
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
                        {drone.peopleCounted}
                    </div>
                    <div className="drone-stat-label">People</div>
                </div>
            </div>
        </div>
    )
}
