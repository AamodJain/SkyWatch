import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { mockDensityHistory, mockZoneDensity } from '../data/mockData'

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
    const pieData = mockZoneDensity
        .filter((z) => z.density > 0)
        .map((z) => ({ name: z.zone, value: z.density }))

    return (
        <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Analytics & Reports
            </h2>
            <div className="analytics-grid">
                {/* Density Over Time */}
                <div className="chart-card full-width" id="density-timeline-chart">
                    <div className="chart-title">Crowd Density Over Time</div>
                    <div className="chart-subtitle">24-hour density trends across monitored zones</div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockDensityHistory}>
                                <defs>
                                    <linearGradient id="gradConnaught" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradChandni" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradHauz" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradNehru" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3555" />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Legend />
                                <Area type="monotone" dataKey="connaught" name="Connaught Pl."
                                    stroke="#3b82f6" fill="url(#gradConnaught)" strokeWidth={2} />
                                <Area type="monotone" dataKey="chandni" name="Chandni Chowk"
                                    stroke="#10b981" fill="url(#gradChandni)" strokeWidth={2} />
                                <Area type="monotone" dataKey="hauz" name="Hauz Khas"
                                    stroke="#8b5cf6" fill="url(#gradHauz)" strokeWidth={2} />
                                <Area type="monotone" dataKey="nehru" name="Nehru Place"
                                    stroke="#f59e0b" fill="url(#gradNehru)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Zone Density Bar Chart */}
                <div className="chart-card" id="zone-density-chart">
                    <div className="chart-title">Zone-wise Density</div>
                    <div className="chart-subtitle">Current person count by monitored zone</div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockZoneDensity} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3555" />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="zone" type="category" stroke="#64748b" fontSize={11} width={100} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Bar dataKey="density" name="People" radius={[0, 6, 6, 0]}>
                                    {mockZoneDensity.map((entry, index) => (
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
