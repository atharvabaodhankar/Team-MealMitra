import { useRef, useEffect, useState, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import {
    BarChart3,
    Activity,
    Building2,
    Handshake,
    Users,
    Map,
    ClipboardList,
    LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
    { key: 'overview', Icon: BarChart3, label: 'Overview' },
    { key: 'activity', Icon: Activity, label: 'Activity Feed' },
    { key: 'ngos', Icon: Building2, label: 'NGO Management' },
    { key: 'donors', Icon: Handshake, label: 'Donor Management' },
]

const AdminSidebar = forwardRef(({ activeSection, onNavigate, user, stats, isOpen }, ref) => {
    const sidebarRef = useRef(null)
    const navigate = useNavigate()
    const auth = useAuth()
    const [loggingOut, setLoggingOut] = useState(false)
    const animatedRef = useRef(false)

    // Sync forwarded ref with internal ref
    useEffect(() => {
        if (!ref) return
        if (typeof ref === 'function') {
            ref(sidebarRef.current)
        } else {
            ref.current = sidebarRef.current
        }
    }, [ref])

    useEffect(() => {
        if (!sidebarRef.current || animatedRef.current) return
        animatedRef.current = true

        const items = sidebarRef.current.querySelectorAll('.admin-sidebar__item')
        gsap.set(items, { opacity: 1, x: 0 })
        gsap.from(items, {
            x: -20,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            delay: 1.5,
            ease: 'power3.out',
            clearProps: 'all',
        })
    }, [])

    const getInitials = (name) => {
        if (!name) return 'A'
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        await auth.logout()
    }

    return (
        <aside
            ref={sidebarRef}
            className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}
        >
            {/* Brand */}
            <div className="admin-sidebar__brand">
                <div className="admin-sidebar__brand-title">Extra to Essential</div>
                <span className="admin-sidebar__brand-sub">Admin Control Panel</span>
            </div>

            {/* Navigation */}
            <nav className="admin-sidebar__nav">
                <div className="admin-sidebar__section-label">Navigation</div>
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.key}
                        className={`admin-sidebar__item ${activeSection === item.key ? 'admin-sidebar__item--active' : ''}`}
                        onClick={() => onNavigate(item.key)}
                        style={{ opacity: 1 }}
                    >
                        <span className="admin-sidebar__item-icon">
                            <item.Icon size={16} strokeWidth={1.8} />
                        </span>
                        <span className="admin-sidebar__item-label">{item.label}</span>
                        {item.key === 'ngos' && stats?.totalNGOs > 0 && (
                            <span className="admin-sidebar__item-badge">{stats.totalNGOs}</span>
                        )}
                        {item.key === 'donors' && stats?.totalDonors > 0 && (
                            <span className="admin-sidebar__item-badge">{stats.totalDonors}</span>
                        )}
                        {item.key === 'volunteers' && stats?.totalVolunteers > 0 && (
                            <span className="admin-sidebar__item-badge">{stats.totalVolunteers}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer: User + Logout */}
            <div className="admin-sidebar__footer">
                <div className="admin-sidebar__user">
                    <div className="admin-sidebar__avatar">
                        {getInitials(user?.full_name)}
                    </div>
                    <div className="admin-sidebar__user-info">
                        <div className="admin-sidebar__user-name">
                            {user?.full_name || 'Admin User'}
                        </div>
                        <div className="admin-sidebar__user-role">
                            {user?.role || 'admin'}
                        </div>
                    </div>
                </div>

                <button
                    className="admin-sidebar__logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    title="Sign out of admin panel"
                >
                    <span className="admin-sidebar__logout-icon">
                        <LogOut size={15} strokeWidth={1.8} />
                    </span>
                    <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
                </button>
            </div>
        </aside>
    )
})

AdminSidebar.displayName = 'AdminSidebar'
export default AdminSidebar