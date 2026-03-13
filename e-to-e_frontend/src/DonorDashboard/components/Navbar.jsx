import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '◎' },
    { id: 'create-donation', label: 'Create Donation', icon: '＋' },
    { id: 'active-donations', label: 'Active Donations', icon: '↗' },
    { id: 'tracking', label: 'Tracking', icon: '◉' },
    { id: 'history', label: 'History', icon: '☰' },
]

export default function Navbar({ activeSection, onNavigate, user }) {
    const navigate = useNavigate()
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const navRef = useRef(null)
    const indicatorRef = useRef(null)
    const profileCardRef = useRef(null)

    /* ── Scroll blur effect ── */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    /* ── Active tab indicator ── */
    useEffect(() => {
        if (!indicatorRef.current || !navRef.current) return
        const activeEl = navRef.current.querySelector(
            `[data-section="${activeSection}"]`
        )
        if (activeEl) {
            gsap.to(indicatorRef.current, {
                x: activeEl.offsetLeft,
                width: activeEl.offsetWidth,
                duration: 0.4,
                ease: 'expo.out',
            })
        }
    }, [activeSection])

    /* ── Close profile card on outside click ── */
    useEffect(() => {
        const handleClick = (e) => {
            if (profileCardRef.current && !profileCardRef.current.contains(e.target)) {
                setProfileOpen(false)
            }
        }
        if (profileOpen) {
            document.addEventListener('mousedown', handleClick)
        }
        return () => document.removeEventListener('mousedown', handleClick)
    }, [profileOpen])

    const handleNav = (id) => {
        onNavigate(id)
        setMobileOpen(false)
    }

    /* ── Derive avatar initial from email ── */
    const email = user?.email || ''
    const avatarLetter = email ? email.charAt(0).toUpperCase() : 'D'
    const displayName = user?.full_name || 'Donor'
    const role = user?.role || 'donor'

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    return (
        <nav
            className={`dd-navbar ${scrolled ? 'dd-navbar--scrolled' : ''}`}
            ref={navRef}
        >
            <div className="dd-navbar__inner container--wide">
                {/* Logo */}
                <a href="/" className="dd-navbar__logo">
                    <span className="dd-navbar__logo-mark">E</span>
                    <span className="dd-navbar__logo-text">Extra-To-Essential</span>
                </a>

                {/* Desktop Nav */}
                <div className="dd-navbar__links">
                    <span className="dd-navbar__indicator" ref={indicatorRef} />
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            data-section={item.id}
                            className={`dd-navbar__link ${activeSection === item.id ? 'dd-navbar__link--active' : ''
                                }`}
                            onClick={() => handleNav(item.id)}
                        >
                            <span className="dd-navbar__link-icon">{item.icon}</span>
                            <span className="dd-navbar__link-text">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* User badge with hoverable profile card */}
                <div className="dd-navbar__user" ref={profileCardRef}>
                    <span className="dd-navbar__user-name">{displayName}</span>
                    <span
                        className="dd-navbar__user-avatar"
                        onClick={() => setProfileOpen(!profileOpen)}
                        title={email}
                    >
                        {avatarLetter}
                    </span>

                    {/* Floating Profile Card */}
                    <div className={`dd-profile-card ${profileOpen ? 'dd-profile-card--visible' : ''}`}>
                        <div className="dd-profile-card__header">
                            <div className="dd-profile-card__avatar">
                                {avatarLetter}
                            </div>
                            <div className="dd-profile-card__info">
                                <div className="dd-profile-card__email">{email || 'No email'}</div>
                                <div className="dd-profile-card__role">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </div>
                            </div>
                        </div>

                        <button
                            className="dd-profile-card__logout"
                            onClick={handleLogout}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Mobile hamburger */}
                <button
                    className={`dd-navbar__hamburger ${mobileOpen ? 'open' : ''}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {/* Mobile drawer */}
            <div className={`dd-navbar__mobile ${mobileOpen ? 'dd-navbar__mobile--open' : ''}`}>
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        className={`dd-navbar__mobile-link ${activeSection === item.id ? 'dd-navbar__mobile-link--active' : ''
                            }`}
                        onClick={() => handleNav(item.id)}
                    >
                        <span className="dd-navbar__link-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </div>
        </nav>
    )
}
