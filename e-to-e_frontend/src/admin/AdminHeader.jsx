import { useState, useEffect, forwardRef } from 'react'
import { Bell, RefreshCw } from 'lucide-react'

const AdminHeader = forwardRef(({ user, alertCount = 0 }, ref) => {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (d) => {
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        })
    }

    const formatDate = (d) => {
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const getGreeting = () => {
        const h = time.getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <header className="admin-header" ref={ref}>
            <div className="admin-header__left">
                <span className="admin-header__greeting">
                    {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Admin'}
                </span>
                <h1 className="admin-header__title">
                    <span className="admin-header__title-brand">Extra to Essential</span>
                    <span className="admin-header__title-sep">&middot;</span>
                    <span className="admin-header__title-sub">Mission Control</span>
                </h1>
            </div>

            <div className="admin-header__right">
                <div className="admin-header__time">
                    <span className="admin-header__time-dot" />
                    {formatTime(time)} &middot; {formatDate(time)}
                </div>

                <button className="admin-header__btn" title="Notifications" aria-label="View notifications">
                    <Bell size={16} strokeWidth={1.8} />
                    {alertCount > 0 && (
                        <span className="admin-header__btn-badge">{alertCount > 9 ? '9+' : alertCount}</span>
                    )}
                </button>

                <button className="admin-header__btn" title="Refresh" aria-label="Refresh data" onClick={() => window.location.reload()}>
                    <RefreshCw size={16} strokeWidth={1.8} />
                </button>
            </div>
        </header>
    )
})

AdminHeader.displayName = 'AdminHeader'
export default AdminHeader