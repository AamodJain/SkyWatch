import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Video,
    BarChart3,
    Radio,
    Shield,
} from 'lucide-react'

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/feeds', label: 'Live Feeds', icon: Video },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
    const location = useLocation()

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
                <div className="sidebar-status">
                    <div className="status-dot" />
                    <Radio size={14} />
                    <span className="status-text">System Online</span>
                </div>
            </div>
        </aside>
    )
}
