import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import OverviewPanel from './OverviewPanel'
import ActivityMonitor from './ActivityMonitor'
import NgoManagement from './NgoManagement'
import DonorManagement from './DonorManagement'
import DonationMonitor from './DonationMonitor'
import MapControl from './MapControl'
import AlertCenter from './AlertCenter'
import { CarbonWallet } from '../components/CarbonWallet'
import {
    getCurrentUser,
    getDashboardSummary,
    getTotalImpact,
    getAllNGOs,
    getAllDonors,
    getAllListings,
    getVolunteerPerformance,
    getDailyTrend,
    getAdminImpactOverview,
} from '../lib/adminApi'
import './AdminStyles.css'

// Suppress GSAP warnings for missing targets during dev/init
if (typeof console !== 'undefined') {
    const originalWarn = console.warn
    console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('GSAP target')) return
        originalWarn(...args)
    }
}

gsap.registerPlugin(ScrollTrigger)

export default function AdminDashboard() {
    const [activeSection, setActiveSection] = useState('overview')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    /* ── Data state ── */
    const [dashboardSummary, setDashboardSummary] = useState(null)
    const [totalImpact, setTotalImpact] = useState(null)
    const [adminImpactOverview, setAdminImpactOverview] = useState(null)
    const [ngos, setNgos] = useState([])
    const [donors, setDonors] = useState([])
    const [listings, setListings] = useState([])
    const [volunteers, setVolunteers] = useState([])
    const [trend, setTrend] = useState([])
    const [alerts, setAlerts] = useState([])
    const [activityFeed, setActivityFeed] = useState([])

    /* ── Refs ── */
    const overlayRef = useRef(null)
    const shellRef = useRef(null)
    const contentRef = useRef(null)
    const masterTl = useRef(null)
    const pollRef = useRef(null)
    const sidebarRef = useRef(null)
    const headerRef = useRef(null)

    /* ── Helpers ── */
    const generateActivityFeed = useCallback((ngosList, donorsList, listingsList) => {
        const feed = []
        const now = Date.now()

        ngosList.slice(0, 5).forEach((n, i) => {
            feed.push({
                id: `ngo-${n.ngo_id}`,
                type: 'ngo',
                message: `<strong>${n.ngo_name || 'NGO'}</strong> registered from ${n.city || 'Unknown'}`,
                time: new Date(n.created_at || now - i * 600000),
            })
        })

        listingsList.slice(0, 8).forEach((l, i) => {
            feed.push({
                id: `listing-${l.listing_id}`,
                type: 'donation',
                message: `New donation: <strong>${l.food_type || 'Food'}</strong> — ${l.quantity_kg || 0} kg`,
                time: new Date(l.created_at || now - i * 300000),
            })
        })

        donorsList.slice(0, 4).forEach((d, i) => {
            feed.push({
                id: `donor-${d.donor_id}`,
                type: 'pickup',
                message: `<strong>${d.profiles?.organization_name || 'Donor'}</strong> joined from ${d.city || 'Unknown'}`,
                time: new Date(d.created_at || now - i * 900000),
            })
        })

        feed.sort((a, b) => b.time - a.time)
        return feed.slice(0, 20)
    }, [])

    /* ── Data fetching ── */
    const fetchAllData = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true)

            const results = await Promise.allSettled([
                getCurrentUser(),
                getDashboardSummary(),
                getTotalImpact(),
                getAdminImpactOverview(),
                getAllNGOs(),
                getAllDonors(),
                getAllListings(),
                getVolunteerPerformance(),
                getDailyTrend(30),
            ])

            const [userRes, summaryRes, impactRes, overviewRes, ngosRes, donorsRes, listingsRes, volRes, trendRes] = results

            if (userRes.status === 'fulfilled') setUser(userRes.value?.user || null)
            if (summaryRes.status === 'fulfilled') setDashboardSummary(summaryRes.value?.summary || null)
            if (impactRes.status === 'fulfilled') setTotalImpact(impactRes.value?.metrics || null)
            if (overviewRes.status === 'fulfilled') setAdminImpactOverview(overviewRes.value || null)

            const ngosList = ngosRes.status === 'fulfilled' ? (ngosRes.value?.ngos || []) : []
            const donorsList = donorsRes.status === 'fulfilled' ? (donorsRes.value?.donors || []) : []
            const listingsList = listingsRes.status === 'fulfilled' ? (listingsRes.value?.listings || []) : []

            setNgos(ngosList)
            setDonors(donorsList)
            setListings(listingsList)

            if (volRes.status === 'fulfilled') setVolunteers(volRes.value?.performance || [])
            if (trendRes.status === 'fulfilled') setTrend(trendRes.value?.trend || [])

            setActivityFeed(generateActivityFeed(ngosList, donorsList, listingsList))
            
            const rejected = results.filter(r => r.status === 'rejected')
            if (rejected.length > 0) {
                console.warn('Some data streams failed:', rejected)
                setError(`Warning: ${rejected.length} data streams failed to load. Displaying partial data.`)
            } else {
                setError(null)
            }
        } catch (err) {
            console.error('Admin data fetch error:', err)
            setError('Failed to load dashboard data. Retrying may help.')
        } finally {
            if (isInitial) setLoading(false)
        }
    }, [user, generateActivityFeed])

    /* ── Initial load ── */
    useEffect(() => {
        fetchAllData(true)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Polling for real-time feel ── */
    useEffect(() => {
        pollRef.current = setInterval(() => fetchAllData(false), 30000)
        return () => clearInterval(pollRef.current)
    }, [fetchAllData])

    /* ═══════════════════════════════════════════════════
       MASTER CINEMATIC ANIMATION TIMELINE
       Film-grade motion choreography
       —— Sidebar handles its own animations internally
       ═══════════════════════════════════════════════════ */
    useEffect(() => {
        if (loading) return

        const ctx = gsap.context(() => {
            masterTl.current = gsap.timeline({
                defaults: { ease: 'power4.out', overwrite: 'auto' },
            })


            // Overlay cinematic fade
            masterTl.current.to(overlayRef.current, {
                opacity: 0,
                duration: 1.2,
                ease: 'power2.inOut',
                onComplete: () => {
                    if (overlayRef.current) overlayRef.current.style.display = 'none'
                },
            })

            // Shell breathes to life
            masterTl.current.fromTo(
                shellRef.current,
                { opacity: 0, scale: 0.98 },
                { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out', clearProps: 'scale' },
                '-=0.6'
            )

            /* ── ACT II: Architecture Reveals ── */

            // Sidebar slides in — ONLY transform x, no opacity change
            // (sidebar children manage their own visibility)
            // Sidebar slides in — ONLY transform x, no opacity change
            // (sidebar children manage their own visibility)
            if (sidebarRef.current) {
                masterTl.current.fromTo(
                    sidebarRef.current,
                    { x: -280 },
                    { x: 0, duration: 0.9, ease: 'expo.out', clearProps: 'x' },
                    '-=0.5'
                )
            }

            // Header drops from above
            // Header drops from above
            if (headerRef.current) {
                masterTl.current.fromTo(
                    headerRef.current,
                    { y: -80, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.2)', clearProps: 'all' },
                    '-=0.5'
                )
            }

            /* ── ACT III: Data Awakening ── */

            // Section titles — text reveal
            const titles = contentRef.current?.querySelectorAll('.admin-section__title')
            if (titles?.length) {
                masterTl.current.fromTo(
                    titles,
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'all' },
                    '-=0.3'
                )
            }

            // Section subtitles
            const subtitles = contentRef.current?.querySelectorAll('.admin-section__subtitle')
            if (subtitles?.length) {
                masterTl.current.fromTo(
                    subtitles,
                    { y: 15, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'all' },
                    '-=0.3'
                )
            }

            // Stat cards — spring up
            const statCards = contentRef.current?.querySelectorAll('.admin-stat-card')
            if (statCards?.length) {
                masterTl.current.fromTo(
                    statCards,
                    { y: 60, opacity: 0, scale: 0.9 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: 'back.out(1.3)', clearProps: 'all' },
                    '-=0.4'
                )
            }

            /* ── ACT IV: Panels Materialize ── */

            // Activity + Donation panels
            const panels = contentRef.current?.querySelectorAll('.admin-activity, .admin-donation-stream')
            if (panels?.length) {
                masterTl.current.fromTo(
                    panels,
                    { y: 40, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'expo.out', clearProps: 'all' },
                    '-=0.3'
                )
            }

            // Tables
            const tables = contentRef.current?.querySelectorAll('.admin-table-wrap')
            if (tables?.length) {
                masterTl.current.fromTo(
                    tables,
                    { y: 40, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', clearProps: 'all' },
                    '-=0.3'
                )
            }

            // Volunteer cards
            const volCards = contentRef.current?.querySelectorAll('.admin-volunteer-card')
            if (volCards?.length) {
                masterTl.current.fromTo(
                    volCards,
                    { y: 30, opacity: 0, scale: 0.92 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.2)', clearProps: 'all' },
                    '-=0.3'
                )
            }

            /* ── ACT V: Map ── */
            const mapWrap = contentRef.current?.querySelector('.admin-map-wrap')
            if (mapWrap) {
                masterTl.current.fromTo(
                    mapWrap,
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', clearProps: 'all' },
                    '-=0.3'
                )
            }

            /* ── ACT VI: Fine Detail Polish ── */

            // Table rows — clearProps ensures they stay visible
            const rows = contentRef.current?.querySelectorAll('.admin-table tbody tr')
            if (rows?.length) {
                masterTl.current.fromTo(
                    rows,
                    { y: 10, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: 'power2.out', clearProps: 'all' },
                    '-=0.4'
                )
            }

            // Badges
            const badges = contentRef.current?.querySelectorAll('.admin-badge')
            if (badges?.length) {
                masterTl.current.fromTo(
                    badges,
                    { scale: 0.85, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.25, stagger: 0.02, ease: 'back.out(2)', clearProps: 'all' },
                    '-=0.3'
                )
            }

            // Header buttons
            const headerBtns = headerRef.current?.querySelectorAll('.admin-header__btn')
            if (headerBtns?.length) {
                masterTl.current.fromTo(
                    headerBtns,
                    { scale: 0.5, opacity: 0, rotate: -45 },
                    { scale: 1, opacity: 1, rotate: 0, duration: 0.4, stagger: 0.08, ease: 'back.out(2)', clearProps: 'all' },
                    '-=0.4'
                )
            }

        }, contentRef)

        return () => ctx.revert()
    }, [loading])

    /* ── Section scroll handler ── */
    const scrollToSection = useCallback((section) => {
        setActiveSection(section)
        setSidebarOpen(false)
        const el = document.getElementById(`admin-${section}`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [])

    /* ── Computed stats ── */
    const stats = {
        totalNGOs: ngos.length,
        totalDonors: donors.length,
        totalVolunteers: volunteers.length,
        totalDonations: listings.length,
        activePickups: listings.filter(l =>
            ['claimed', 'scheduled', 'in_discussion'].includes(l.status)
        ).length,
        completedDeliveries: listings.filter(l => l.status === 'completed').length,
    }

    if (loading) {
        return (
            <div className="admin-shell" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                <div className="admin-loader">
                    <div className="admin-loader__ring" />
                    <div className="admin-loader__text">Initializing Command Center…</div>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Cinematic Overlay */}
            <div className="admin-overlay" ref={overlayRef} />

            <div className="admin-shell" ref={shellRef}>
                {/* Mobile Sidebar Toggle */}
                <button
                    className="admin-sidebar-toggle"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle sidebar"
                >
                    ☰
                </button>

                {/* Sidebar */}
                <AdminSidebar
                    ref={sidebarRef}
                    activeSection={activeSection}
                    onNavigate={scrollToSection}
                    user={user}
                    stats={stats}
                    isOpen={sidebarOpen}
                />

                {/* Main Area */}
                <div className="admin-main">
                    <AdminHeader ref={headerRef} user={user} alertCount={alerts.length} />

                    <div className="admin-content" ref={contentRef}>
                        {error && (
                            <div className="admin-error">
                                <div className="admin-error__icon">⚠</div>
                                <div className="admin-error__title">Connection Issue</div>
                                <div className="admin-error__msg">{error}</div>
                                <button className="admin-error__retry" onClick={() => fetchAllData(true)}>
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* 1 — Global Overview */}
                        <div id="admin-overview">
                            <OverviewPanel stats={stats} totalImpact={totalImpact} />

                            {/* Carbon Wallet — Platform Overview */}
                            <div className="admin-section admin-section--wallet" style={{ marginTop: '1.5rem' }}>
                                <div className="admin-section__header">
                                    <span className="admin-section__label">CARBON CREDIT ISSUANCE</span>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <CarbonWallet
                                        impactSummary={adminImpactOverview ? {
                                            impact_points_balance: adminImpactOverview.wallets_near_threshold ?? 0,
                                            carbon_credits: adminImpactOverview.total_credits_minted ?? 0,
                                            lifetime_impact_points: adminImpactOverview.total_credits_minted ?? 0,
                                        } : null}
                                        loading={!adminImpactOverview}
                                    />
                                    {adminImpactOverview && (
                                        <div className="admin-issuance-meta">
                                            <div className="admin-issuance-stat">
                                                <span className="admin-issuance-stat__label">Credits Minted Today</span>
                                                <span className="admin-issuance-stat__value">{adminImpactOverview.credits_minted_today}</span>
                                            </div>
                                            <div className="admin-issuance-stat">
                                                <span className="admin-issuance-stat__label">Wallets at Threshold</span>
                                                <span className="admin-issuance-stat__value">{adminImpactOverview.wallets_near_threshold}</span>
                                                <span className="admin-issuance-stat__note">( &ge; 80 IP )</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2 & 6 — Activity + Donations side by side */}
                        <div className="admin-grid-two" id="admin-activity">
                            <ActivityMonitor feed={activityFeed} />
                            <DonationMonitor listings={listings} />
                        </div>

                        {/* 3 — NGO Management */}
                        <div id="admin-ngos">
                            <NgoManagement ngos={ngos} onRefresh={() => fetchAllData(false)} />
                        </div>

                        {/* 4 — Donor Management */}
                        <div id="admin-donors">
                            <DonorManagement donors={donors} onRefresh={() => fetchAllData(false)} />
                        </div>


                        {/* 6 — Live Donation Map */}
                        <div id="admin-live-map" className="admin-section">
                            <MapControl ngos={ngos} donors={donors} listings={listings} />
                        </div>
                    </div>
                </div>

                {/* 8 — Alert Center */}
                <AlertCenter alerts={alerts} setAlerts={setAlerts} />
            </div>
        </>
    )
}