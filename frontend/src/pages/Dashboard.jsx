import { useEffect, useState } from 'react'
import MapView from '../components/MapView'
import DensityStats from '../components/DensityStats'
import DroneCard from '../components/DroneCard'

export default function Dashboard() {
    const debugPlayback = true // new URLSearchParams(window.location.search).get('debugPlayback') === '1'
    const [drones, setDrones] = useState([])
    const [focusedDroneId, setFocusedDroneId] = useState(null)
    const [focusRequestId, setFocusRequestId] = useState(0)
    const [selectedDrone, setSelectedDrone] = useState(null)
    const [autoViewDrones, setAutoViewDrones] = useState(() => {
        try {
            const raw = localStorage.getItem('autoViewDrones')
            if (!raw) return {}
            const parsed = JSON.parse(raw)
            return parsed && typeof parsed === 'object' ? parsed : {}
        } catch {
            return {}
        }
    })
    const [filterName, setFilterName] = useState('')
    const [filterRegion, setFilterRegion] = useState('')
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
        try {
            localStorage.setItem('autoViewDrones', JSON.stringify(autoViewDrones))
        } catch {
            // Ignore storage failures.
        }
    }, [autoViewDrones])

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
                    selectedDrone={selectedDrone}
                    setSelectedDrone={setSelectedDrone}
                />
                <div className="drones-panel">
                    <div className="drones-panel-header">
                        <h3 className="drones-panel-title">Fleet Status</h3>
                        <span className="drones-count" id="drone-count-badge">
                            {activeDrones.length}/{totalDrones}
                        </span>
                    </div>
                    <div className="drones-panel-filters" style={{ padding: '0 20px 12px 20px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <input 
                            type="text" 
                            placeholder="Filter by Drone Name / ID..." 
                            value={filterName} 
                            onChange={e => setFilterName(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px', outline: 'none' }}
                        />
                        <input 
                            type="text" 
                            placeholder="Filter by Region / Zone..." 
                            value={filterRegion} 
                            onChange={e => setFilterRegion(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '13px', outline: 'none' }}
                        />
                    </div>
                    <div className="drones-list">
                        {drones.filter(drone => {
                            const matchesName = drone.name.toLowerCase().includes(filterName.toLowerCase()) || drone.id.toLowerCase().includes(filterName.toLowerCase())
                            const matchesRegion = (drone.zone || '').toLowerCase().includes(filterRegion.toLowerCase())
                            return matchesName && matchesRegion
                        }).map((drone) => {
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
                                    isAutoView={!!autoViewDrones[drone.id]}
                                    onToggleView={(e) => {
                                        e.stopPropagation()
                                        setAutoViewDrones(prev => ({
                                            ...prev,
                                            [drone.id]: !prev[drone.id]
                                        }))
                                    }}
                                    onThresholdChange={(newThreshold) => {
                                        setMaxIntensityByDrone(prev => ({
                                            ...prev,
                                            [drone.id]: newThreshold
                                        }))
                                    }}
                                    onClick={() => {
                                        setFocusedDroneId(drone.id)
                                        setFocusRequestId((prev) => prev + 1)
                                        if (autoViewDrones[drone.id]) {
                                            setSelectedDrone(drone)
                                        } else {
                                            setSelectedDrone(null)
                                        }
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
