import { useEffect, useState } from 'react'
import MapView from '../components/MapView'
import DensityStats from '../components/DensityStats'
import DroneCard from '../components/DroneCard'

export default function Dashboard() {
    const debugPlayback = new URLSearchParams(window.location.search).get('debugPlayback') === '1'
    const [drones, setDrones] = useState([])
    const [focusedDroneId, setFocusedDroneId] = useState(null)
    const [focusRequestId, setFocusRequestId] = useState(0)
    const [maxIntensityByDrone, setMaxIntensityByDrone] = useState(() => {
        try {
            const raw = localStorage.getItem('maxIntensityByDrone')
            if (!raw) return {}
            const parsed = JSON.parse(raw)
            return parsed && typeof parsed === 'object' ? parsed : {}
        } catch {
            return {}
        }
    })
    const activeDrones = drones.filter((d) => d.status === 'active')
    const totalDrones = drones.length

    useEffect(() => {
        try {
            localStorage.setItem('maxIntensityByDrone', JSON.stringify(maxIntensityByDrone))
        } catch {
            // Ignore storage failures.
        }
    }, [maxIntensityByDrone])

    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/drones/?include_debug=${debugPlayback}`)
                if (res.ok) {
                    const data = await res.json()
                    setDrones(data.drones || [])
                }
            } catch (err) {
                console.error('Failed to load drones:', err)
            }
        }

        fetchDrones()
        const interval = setInterval(fetchDrones, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <DensityStats />
            <div className="dashboard-grid">
                <MapView
                    focusedDroneId={focusedDroneId}
                    focusRequestId={focusRequestId}
                    maxIntensityByDrone={maxIntensityByDrone}
                    setMaxIntensityByDrone={setMaxIntensityByDrone}
                />
                <div className="drones-panel">
                    <div className="drones-panel-header">
                        <h3 className="drones-panel-title">Fleet Status</h3>
                        <span className="drones-count" id="drone-count-badge">
                            {activeDrones.length}/{totalDrones}
                        </span>
                    </div>
                    <div className="drones-list">
                        {drones.map((drone) => {
                            const threshold = Number(maxIntensityByDrone[drone.id] ?? 100)
                            const density = Number(drone.headcountDensity || 0)
                            const isLiveDrone = drone.status === 'active' || drone.status === 'debug'
                            const isCritical = isLiveDrone && density >= threshold

                            return (
                                <DroneCard
                                    key={drone.id}
                                    drone={drone}
                                    threshold={threshold}
                                    isCritical={isCritical}
                                    isFocused={focusedDroneId === drone.id}
                                    onClick={() => {
                                        setFocusedDroneId(drone.id)
                                        setFocusRequestId((prev) => prev + 1)
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}
