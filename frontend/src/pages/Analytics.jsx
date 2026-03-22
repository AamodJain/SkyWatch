import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

const customTooltipStyle = {
    backgroundColor: '#1a1f36',
    border: '1px solid #2d3555',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#f1f5f9',
    fontSize: '12px',
}

export default function Analytics() {
    const [timeline, setTimeline] = useState([])
    const [drones, setDrones] = useState([])

    useEffect(() => {
        const fetchLive = async () => {
            try {
                const [densityRes, dronesRes] = await Promise.all([
                    fetch('http://localhost:8000/api/density/current'),
                    fetch('http://localhost:8000/api/drones/'),
                ])

                if (dronesRes.ok) {
                    const dronesData = await dronesRes.json()
                    setDrones(dronesData.drones || [])
                }

                if (densityRes.ok) {
                    const densityData = await densityRes.json()
                    const current = densityData.current_data || {}
                    const now = new Date()
                    const label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    setTimeline((prev) => {
                        const next = [
                            ...prev,
                            {
                                time: label,
                                density: Number(current.headcount || 0),
                                people: Number(current.points_count || 0),
                            },
                        ]
                        return next.slice(-30)
                    })
                }
            } catch (err) {
                console.error('Failed to load analytics data:', err)
            }
        }

        fetchLive()
        const interval = setInterval(fetchLive, 1000)
        return () => clearInterval(interval)
    }, [])

    const zoneDensity = useMemo(
        () => drones.map((d) => ({ zone: d.name, density: Number(d.peopleCounted || 0) })),
        [drones],
    )

    const pieData = useMemo(
        () => zoneDensity.filter((z) => z.density > 0).map((z) => ({ name: z.zone, value: z.density })),
        [zoneDensity],
    )

    return (
        <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Analytics & Reports
            </h2>
            <div className="analytics-grid">
                {/* Density Over Time */}
                <div className="chart-card full-width" id="density-timeline-chart">
                    <div className="chart-title">Crowd Density Over Time</div>
                    <div className="chart-subtitle">Live density timeline from backend stream data</div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeline}>
                                <defs>
                                    <linearGradient id="gradDensity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradPeople" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3555" />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Legend />
                                <Area type="monotone" dataKey="density" name="Density"
                                    stroke="#3b82f6" fill="url(#gradDensity)" strokeWidth={2} />
                                <Area type="monotone" dataKey="people" name="People"
                                    stroke="#10b981" fill="url(#gradPeople)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Zone Density Bar Chart */}
                <div className="chart-card" id="zone-density-chart">
                    <div className="chart-title">Zone-wise Density</div>
                    <div className="chart-subtitle">Current person count by live stream</div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zoneDensity} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3555" />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="zone" type="category" stroke="#64748b" fontSize={11} width={100} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Bar dataKey="density" name="People" radius={[0, 6, 6, 0]}>
                                    {zoneDensity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Pie Chart */}
                <div className="chart-card" id="distribution-chart">
                    <div className="chart-title">Crowd Distribution</div>
                    <div className="chart-subtitle">Percentage share across active zones</div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: '#64748b' }}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="transparent"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={customTooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    )
}
