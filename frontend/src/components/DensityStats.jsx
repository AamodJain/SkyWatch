import { useState, useEffect } from 'react'
import { Users, Plane, Activity, AlertTriangle } from 'lucide-react'
import { mockDrones } from '../data/mockData'

export default function DensityStats() {
    const [liveData, setLiveData] = useState({ headcount: 0 });

    useEffect(() => {
        const fetchDensity = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/density/current');
                if (res.ok) {
                    const data = await res.json();
                    if (data.current_data) setLiveData(data.current_data);
                }
            } catch (err) {
                console.error("Error fetching live density", err);
            }
        };

        fetchDensity();
        const interval = setInterval(fetchDensity, 1000); // Poll every 1 second
        return () => clearInterval(interval);
    }, []);

    // Use liveData.headcount instead of mock calculation
    const totalPeople = Math.round(liveData.headcount) || 0;
    const activeDrones = mockDrones.filter((d) => d.status === 'active').length
    const avgDensity = Math.round(totalPeople / (activeDrones || 1))
    const alertsCount = totalPeople > 400 ? 1 : 0; // Simple alert if total people > 400

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
            value: `${activeDrones} / ${mockDrones.length}`,
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
