import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    Video,
    BarChart3,
    Radio,
    Shield,
    Info,
    WifiOff,
} from 'lucide-react'

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/feeds', label: 'Live Feeds', icon: Video },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/about', label: 'About', icon: Info },
]

export default function Sidebar() {
    const location = useLocation()
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // simple quick request to check if backend is alive
                const res = await fetch('http://localhost:8000/api/drones/', {
                    method: 'GET',
                })
                setIsOnline(res.ok)
            } catch (error) {
                setIsOnline(false)
            }
        }
        
        checkStatus()
        const interval = setInterval(checkStatus, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Shield />
                </div>
                <div>
                    <div className="sidebar-title">SkyWatch</div>
                    <div className="sidebar-subtitle">Surveillance Portal</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Main Menu</div>
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <Icon />
                            <span>{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-status" style={!isOnline ? { background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' } : {}}>
                    <div className="status-dot" style={!isOnline ? { background: '#ef4444', animation: 'none' } : {}} />
                    {isOnline ? <Radio size={14} style={{ color: '#10b981' }} /> : <WifiOff size={14} style={{ color: '#ef4444' }} />}
                    <span className="status-text" style={!isOnline ? { color: '#ef4444' } : {}}>
                        {isOnline ? 'System Online' : 'System Offline'}
                    </span>
                </div>
            </div>
        </aside>
    )
}
