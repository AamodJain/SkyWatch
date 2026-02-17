import MapView from '../components/MapView'
import DensityStats from '../components/DensityStats'
import DroneCard from '../components/DroneCard'
import { mockDrones } from '../data/mockData'

export default function Dashboard() {
    const activeDrones = mockDrones.filter((d) => d.status === 'active')
    const totalDrones = mockDrones.length

    return (
        <>
            <DensityStats />
            <div className="dashboard-grid">
                <MapView />
                <div className="drones-panel">
                    <div className="drones-panel-header">
                        <h3 className="drones-panel-title">Fleet Status</h3>
                        <span className="drones-count" id="drone-count-badge">
                            {activeDrones.length}/{totalDrones}
                        </span>
                    </div>
                    <div className="drones-list">
                        {mockDrones.map((drone) => (
                            <DroneCard key={drone.id} drone={drone} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
