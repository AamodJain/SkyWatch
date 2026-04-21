import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Settings, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'
import { useSettings } from '../context/SettingsContext'

const pageTitles = {
    '/': 'Command Center',
    '/feeds': 'Live Drone Feeds',
    '/analytics': 'Analytics & Reports',
}

export default function Navbar() {
    const location = useLocation()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const settingsRef = useRef(null)
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification()
    const { hideFleetLabels, setHideFleetLabels, dashboardTextSize, setDashboardTextSize, showLivePanelInfo, setShowLivePanelInfo, theme, setTheme } = useSettings()

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsNotificationOpen(false)
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setIsSettingsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
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
                
                <div className="notification-wrapper" ref={dropdownRef}>
                    <button 
                        className={`navbar-btn ${unreadCount > 0 ? 'notification-badge' : ''}`}
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                    </button>

                    {isNotificationOpen && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className="mark-all-read" onClick={markAllAsRead}>
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="notification-empty">
                                        <CheckCircle2 size={32} />
                                        <p>You're all caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`notification-item ${notif.isRead ? 'read' : 'unread'} ${notif.type}`}
                                            onClick={() => markAsRead(notif.id)}
                                        >
                                            <div className="notification-icon">
                                                {notif.type === 'critical' ? <AlertTriangle size={18} /> : <Info size={18} />}
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-title">{notif.droneName}</div>
                                                <div className="notification-message">{notif.message}</div>
                                                <div className="notification-time">
                                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                            </div>
                                            {!notif.isRead && <div className="notification-dot" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="notification-wrapper" ref={settingsRef}>
                    <button className="navbar-btn" id="settings-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                        <Settings size={18} />
                    </button>
                    {isSettingsOpen && (
                        <div className="notification-dropdown settings-dropdown" style={{ width: '250px' }}>
                            <div className="notification-header">
                                <h3>Settings</h3>
                            </div>
                            <div className="notification-list" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px' }}>Hide Fleet Labels</span>
                                    <input 
                                        type="checkbox" 
                                        checked={hideFleetLabels} 
                                        onChange={(e) => setHideFleetLabels(e.target.checked)} 
                                        style={{ cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px' }}>Show Live Panel Info</span>
                                    <input 
                                        type="checkbox" 
                                        checked={showLivePanelInfo} 
                                        onChange={(e) => setShowLivePanelInfo(e.target.checked)} 
                                        style={{ cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <span style={{ fontSize: '13px' }}>Dashboard Text Size</span>
                                    <select 
                                        value={dashboardTextSize} 
                                        onChange={(e) => setDashboardTextSize(e.target.value)}
                                        style={{ background: 'var(--color-bg-secondary)', color: 'white', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                    >
                                        <option value="very-small">Very Small</option>
                                        <option value="small">Small</option>
                                        <option value="medium">Normal</option>
                                        <option value="large">Large</option>
                                        <option value="very-large">Very Large</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <span style={{ fontSize: '13px' }}>Theme</span>
                                    <select 
                                        value={theme} 
                                        onChange={(e) => setTheme(e.target.value)}
                                        style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                    >
                                        <option value="dark">Dark Mode</option>
                                        <option value="light">Light Mode</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
