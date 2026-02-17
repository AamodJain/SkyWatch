import { Users, Plane, Activity, AlertTriangle } from 'lucide-react'
import { mockDrones } from '../data/mockData'

export default function DensityStats() {
    const totalPeople = mockDrones.reduce((sum, d) => sum + d.peopleCounted, 0)
    const activeDrones = mockDrones.filter((d) => d.status === 'active').length
    const avgDensity = Math.round(totalPeople / (activeDrones || 1))
    const alertsCount = mockDrones.filter((d) => d.peopleCounted > 400).length

    const stats = [
        {
            label: 'Total People Detected',
            value: totalPeople.toLocaleString(),
            trend: '+12%',
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
