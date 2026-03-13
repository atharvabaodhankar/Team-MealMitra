import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { Bell, X } from 'lucide-react'

export default function AlertCenter({ alerts, setAlerts }) {
    const [toasts, setToasts] = useState([])
    const [activePopup, setActivePopup] = useState(null)
    const stackRef = useRef(null)
    const toastIdRef = useRef(0)

    /* Push toast notification */
    const pushToast = useCallback((toast) => {
        const id = ++toastIdRef.current
        const newToast = { id, ...toast, visible: false }
        setToasts(prev => [...prev, newToast])

        requestAnimationFrame(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t))
        })

        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 500)
        }, 6000)
    }, [])

    /* Watch for new alerts */
    useEffect(() => {
        if (!alerts || alerts.length === 0) return

        const latest = alerts[alerts.length - 1]
        if (latest && !latest._shown) {
            pushToast({
                type: latest.type || 'info',
                title: latest.title || 'Alert',
                message: latest.message || '',
            })
            latest._shown = true
        }
    }, [alerts, pushToast])

    const dismissToast = (id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 500)
    }

    const closePopup = () => {
        setActivePopup(null)
    }

    return (
        <>
            {/* Toast Stack */}
            <div className="admin-toast-stack" ref={stackRef}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`admin-toast ${toast.visible ? 'admin-toast--visible' : ''}`}
                    >
                        <span className="admin-toast__icon">
                            <Bell size={16} strokeWidth={1.8} />
                        </span>
                        <div className="admin-toast__content">
                            <div className="admin-toast__title">{toast.title}</div>
                            <div className="admin-toast__msg">{toast.message}</div>
                        </div>
                        <button
                            className="admin-toast__close"
                            onClick={() => dismissToast(toast.id)}
                            aria-label="Dismiss"
                        >
                            <X size={14} strokeWidth={2} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Popup Alert Overlay */}
            <div
                className={`admin-alert-overlay ${activePopup ? 'admin-alert-overlay--active' : ''}`}
                onClick={closePopup}
            >
                {activePopup && (
                    <div className="admin-alert-popup" onClick={e => e.stopPropagation()}>
                        <div className={`admin-alert-popup__icon admin-alert-popup__icon--${activePopup.type || 'info'}`}>
                            <Bell size={28} strokeWidth={1.5} />
                        </div>
                        <div className="admin-alert-popup__title">{activePopup.title}</div>
                        <div className="admin-alert-popup__msg">{activePopup.message}</div>
                        <button className="admin-alert-popup__btn" onClick={closePopup}>
                            Dismiss
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}