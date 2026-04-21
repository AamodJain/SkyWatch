import { useState } from 'react'
import { Battery, ArrowUp, Users, Eye, Edit2 } from 'lucide-react'
import droneIcon from '../assets/drone.png'
import { useSettings } from '../context/SettingsContext'

export default function DroneCard({ drone, threshold = 100, isCritical = false, onClick, isFocused = false, isAutoView = false, onToggleView, onThresholdChange }) {
    const badgeClass = isCritical ? 'critical' : drone.status
    const badgeLabel = isCritical ? 'critical' : drone.status
    const { hideFleetLabels, dashboardTextSize } = useSettings()
    const [showThresholdModal, setShowThresholdModal] = useState(false)
    const [tempThreshold, setTempThreshold] = useState(threshold)

    return (
        <div
            className={`drone-card ${isFocused ? 'focused' : ''} ${isCritical ? 'critical' : ''}`}
            id={`drone-${drone.id}`}
            onClick={onClick}
        >
            <div className="drone-card-top">
                <div className="drone-name">
                    <img src={droneIcon} alt="Drone" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    {drone.name}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setTempThreshold(threshold)
                            setShowThresholdModal(true)
                        }}
                        title="Set Expected Limit"
                        style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-secondary)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Edit2 size={11} />
                        Limit
                    </button>
                    <button
                        className={`view-toggle-btn ${isAutoView ? 'active' : ''}`}
                        onClick={onToggleView}
                        title="Toggle Auto-View Video on Click"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isAutoView ? 'var(--color-accent-green)' : 'var(--color-bg-secondary)',
                            color: isAutoView ? '#fff' : 'var(--color-text-primary)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        <Eye size={12} />
                        View
                    </button>
                    <span className={`drone-status-badge ${badgeClass}`}>
                        {badgeLabel}
                    </span>
                </div>
            </div>

            <div className="drone-card-stats">
                <div className="drone-stat">
                    <div className="drone-stat-value">
                        <Battery size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {drone.battery}%
                    </div>
                    {!hideFleetLabels && <div className="drone-stat-label">Battery</div>}
                </div>
                <div className="drone-stat">
                    <div className="drone-stat-value">
                        <ArrowUp size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {drone.altitude}m
                    </div>
                    {!hideFleetLabels && <div className="drone-stat-label">Altitude</div>}
                </div>
                <div className="drone-stat">
                    <div className="drone-stat-value">
                        <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {threshold}
                    </div>
                    {!hideFleetLabels && <div className="drone-stat-label">Expected Limit</div>}
                </div>
            </div>

            {showThresholdModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={(e) => { e.stopPropagation(); setShowThresholdModal(false) }}
                >
                    <div 
                        style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            padding: '24px',
                            width: '320px',
                            boxShadow: 'var(--glass-shadow)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: '600' }}>Set Expected Limit</h4>
                        <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.4' }}>
                            Enter the maximum expected crowd limit for <strong style={{color: 'var(--color-text-primary)'}}>{drone.name}</strong>. Alerts will trigger if exceeded.
                        </p>
                        <input
                            type="number"
                            value={tempThreshold}
                            onChange={(e) => setTempThreshold(e.target.value)}
                            autoFocus
                            style={{
                                width: '100%',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border-light)',
                                color: 'var(--color-text-primary)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                                fontSize: '14px',
                                outline: 'none',
                                marginBottom: '20px',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-blue)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-light)'}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = Number(tempThreshold)
                                    if (!isNaN(val) && val > 0) {
                                        onThresholdChange && onThresholdChange(val)
                                        setShowThresholdModal(false)
                                    }
                                }
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                onClick={() => setShowThresholdModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--color-border-light)',
                                    color: 'var(--color-text-secondary)',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--color-bg-secondary)'; e.target.style.color = 'var(--color-text-primary)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--color-text-secondary)'; }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    const val = Number(tempThreshold)
                                    if (!isNaN(val) && val > 0) {
                                        onThresholdChange && onThresholdChange(val)
                                        setShowThresholdModal(false)
                                    }
                                }}
                                style={{
                                    background: 'var(--color-accent-blue)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                                onMouseLeave={(e) => e.target.style.background = 'var(--color-accent-blue)'}
                            >
                                Save Limit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
