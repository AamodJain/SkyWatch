import { useState, useEffect } from 'react'
import { Users, Plane, Activity, AlertTriangle } from 'lucide-react'

export default function DensityStats() {
    const [liveData, setLiveData] = useState({ headcount: 0 });
    const [activeDroneCount, setActiveDroneCount] = useState(0);
    const [totalDroneCount, setTotalDroneCount] = useState(0);
    const [criticalZonesCount, setCriticalZonesCount] = useState(0);
    const [avgDensity, setAvgDensity] = useState(0);
    const debugPlayback = new URLSearchParams(window.location.search).get('debugPlayback') === '1'

    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/drones/?include_debug=${debugPlayback}`);
                if (res.ok) {
                    const data = await res.json();
                    const drones = data.drones || [];
                    const activeDrones = drones.filter((d) => d.status === 'active' || d.status === 'debug');

                    setTotalDroneCount(drones.length);
                    setActiveDroneCount(activeDrones.length);

                    const totalPeopleFromDrones = activeDrones.reduce(
                        (sum, d) => sum + Number(d.headcountDensity || 0),
                        0,
                    );
                    setLiveData({ headcount: totalPeopleFromDrones });

                    const computedAvgDensity = Math.round(totalPeopleFromDrones / (activeDrones.length || 1));
                    setAvgDensity(computedAvgDensity);

                    let thresholdsByDrone = {};
                    try {
                        const raw = localStorage.getItem('maxIntensityByDrone');
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (parsed && typeof parsed === 'object') {
                                thresholdsByDrone = parsed;
                            }
                        }
                    } catch {
                        thresholdsByDrone = {};
                    }

                    const criticalCount = activeDrones.reduce((count, d) => {
                        const threshold = Number(thresholdsByDrone[d.id] ?? 100);
                        const density = Number(d.headcountDensity || 0);
                        return count + (density >= threshold ? 1 : 0);
                    }, 0);
                    setCriticalZonesCount(criticalCount);
                }
            } catch (err) {
                console.error("Error fetching drones", err);
            }
        };

        fetchDrones();
        const droneInterval = setInterval(fetchDrones, 1000);
        return () => {
            clearInterval(droneInterval);
        };
    }, []);

    // Use liveData.headcount derived from active drone streams
    const totalPeople = Math.round(liveData.headcount) || 0;
    const activeDrones = activeDroneCount
    const alertsCount = criticalZonesCount;

    const stats = [
        {
            label: 'Total People Detected',
            value: totalPeople.toLocaleString(),
            trend: 'Live Stream',
            trendDir: 'up',
            icon: Users,
            color: 'blue',
        },
        {
            label: 'Active Drones',
            value: `${activeDrones} / ${totalDroneCount}`,
            trend: 'Online',
            trendDir: 'up',
            icon: Plane,
            color: 'green',
        },
        {
            label: 'Avg. Density / Zone',
            value: avgDensity.toLocaleString(),
            trend: '+5%',
            trendDir: 'up',
            icon: Activity,
            color: 'purple',
        },
        {
            label: 'Critical Zones',
            value: alertsCount,
            trend: alertsCount > 0 ? 'Action Needed' : 'All Clear',
            trendDir: alertsCount > 0 ? 'up' : 'down',
            icon: AlertTriangle,
            color: 'amber',
        },
    ]

    return (
        <div className="stats-grid">
            {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                    <div key={i} className={`stat-card ${stat.color}`} id={`stat-card-${i}`}>
                        <div className="stat-card-header">
                            <div className={`stat-card-icon ${stat.color}`}>
                                <Icon size={20} />
                            </div>
                            <span className={`stat-card-trend ${stat.trendDir}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-label">{stat.label}</div>
                    </div>
                )
            })}
        </div>
    )
}
