import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ activeSection, onNavigate, user, collapsed, onToggleCollapse }) {
    const { t } = useTranslation('dashboard')
    const navigate = useNavigate()
    const auth = useAuth()
    const sidebarRef = useRef(null)
    const [mobileOpen, setMobileOpen] = useState(false)

    const NAV_ITEMS = [
        {
            id: 'overview', label: t('sidebar.overview'), category: t('sidebar.categories.main'),
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            ),
        },
        {
            id: 'create-donation', label: t('sidebar.createDonation'), category: t('sidebar.categories.main'),
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            ),
        },
        {
            id: 'active-donations', label: t('sidebar.activeDonations'), category: t('sidebar.categories.operations'),
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            ),
        },
        {
            id: 'tracking', label: t('sidebar.tracking'), category: t('sidebar.categories.operations'),
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
            ),
        },
        {
            id: 'history', label: t('sidebar.history'), category: t('sidebar.categories.archive'),
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            id: 'profile', label: t('sidebar.profile'), category: null,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ]

    /* ── Close mobile menu on resize above mobile breakpoint ── */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 480) setMobileOpen(false)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    /* ── Lock body scroll when mobile menu is open ── */
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    const email = user?.email || ''
    const avatarLetter = email ? email.charAt(0).toUpperCase() : 'D'
    const displayName = user?.full_name || 'Donor'
    const role = user?.role || 'donor'

    const handleLogout = async () => {
        await auth.logout()
    }

    const handleMobileNav = (id) => {
        onNavigate(id)
        setMobileOpen(false)
    }

    /* ── Group nav items by category ── */
    const categories = []
    let lastCategory = null
    NAV_ITEMS.forEach((item) => {
        if (item.category && item.category !== lastCategory) {
            categories.push({ type: 'label', text: item.category })
            lastCategory = item.category
        }
        categories.push({ type: 'item', ...item })
    })

    return (
        <>
            {/* ── Mobile Hamburger Button (visible only on ≤480px) ── */}
            <button
                className={`dd-mobile-hamburger ${mobileOpen ? 'dd-mobile-hamburger--active' : ''}`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu"
                id="dd-mobile-toggle"
            >
                <span />
                <span />
                <span />
            </button>

            {/* ── Mobile Backdrop ── */}
            {mobileOpen && (
                <div
                    className="dd-mobile-backdrop"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`dd-sidebar ${collapsed ? 'dd-sidebar--collapsed' : ''} ${mobileOpen ? 'dd-sidebar--mobile-open' : ''}`}
                ref={sidebarRef}
            >
                {/* ── Header ── */}
                <div className="dd-sidebar__header">
                    <a href="/" className="dd-sidebar__logo">
                        <span className="dd-sidebar__logo-mark">E</span>
                        <span className="dd-sidebar__logo-text">Extra-To-Essential</span>
                    </a>
                </div>

                {/* ── Collapse Toggle ── */}
                <button
                    className="dd-sidebar__toggle"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed ? (
                            <polyline points="9 18 15 12 9 6" />
                        ) : (
                            <polyline points="15 18 9 12 15 6" />
                        )}
                    </svg>
                </button>

                {/* ── Navigation ── */}
                <nav className="dd-sidebar__nav">
                    {categories.map((entry, i) => {
                        if (entry.type === 'label') {
                            if (collapsed && !mobileOpen) return null
                            return (
                                <span key={`cat-${i}`} className="dd-sidebar__category">
                                    {entry.text}
                                </span>
                            )
                        }

                        return (
                            <button
                                key={entry.id}
                                data-section={entry.id}
                                className={`dd-sidebar__link ${activeSection === entry.id ? 'dd-sidebar__link--active' : ''}`}
                                onClick={() => handleMobileNav(entry.id)}
                                title={collapsed && !mobileOpen ? entry.label : undefined}
                            >
                                <span className="dd-sidebar__link-icon">{entry.icon}</span>
                                <span className="dd-sidebar__link-text">{entry.label}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* ── Bottom: User ── */}
                <div className="dd-sidebar__footer">
                    <div className="dd-sidebar__divider" />
                    <div className="dd-sidebar__user" onClick={() => handleMobileNav('profile')}>
                        <span className="dd-sidebar__user-avatar">{avatarLetter}</span>
                        <div className="dd-sidebar__user-info">
                            <span className="dd-sidebar__user-name">{displayName}</span>
                            <span className="dd-sidebar__user-role">
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </span>
                        </div>
                    </div>
                    <button className="dd-sidebar__logout" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}
