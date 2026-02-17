import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'

const pageTitles = {
    '/': 'Command Center',
    '/feeds': 'Live Drone Feeds',
    '/analytics': 'Analytics & Reports',
}

export default function Navbar() {
    const location = useLocation()
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (date) =>
        date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })

    const formatDate = (date) =>
        date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        })

    return (
        <header className="navbar">
            <div className="navbar-left">
                <div>
                    <h1 className="navbar-title">
                        {pageTitles[location.pathname] || 'Dashboard'}
                    </h1>
                    <div className="navbar-breadcrumb">
                        SkyWatch / {pageTitles[location.pathname] || 'Page'}
                    </div>
                </div>
            </div>

            <div className="navbar-right">
                <span className="navbar-time">
                    {formatDate(currentTime)} &nbsp;·&nbsp; {formatTime(currentTime)}
                </span>
                <button className="navbar-btn notification-badge" id="notifications-btn">
                    <Bell size={18} />
                </button>
                <button className="navbar-btn" id="settings-btn">
                    <Settings size={18} />
                </button>
            </div>
        </header>
    )
}
