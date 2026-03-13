import { useState, useEffect, useCallback, useRef } from 'react'
import { gsap } from 'gsap'
import { useTranslation } from 'react-i18next'
import Sidebar from '../components/Sidebar'
import StatCards from '../components/StatCards'
import DonationForm from '../components/DonationForm'
import ActiveTable from '../components/ActiveTable'
import TrackingMap from '../components/TrackingMap'
import HistoryTable from '../components/HistoryTable'
import BlogPanel from '../components/BlogPanel'
import ProfileSection from '../components/ProfileSection'
import Loader from '../components/Loader'
import { CarbonWallet } from '../../components/CarbonWallet'
import {
    killAllAnimations,
} from '../animations/dashboardAnimations'
import {
    getCurrentUser,
    getDonorProfile,
    updateDonorProfile,
    getMyListings,
    getDonorImpact,
    getImpactSummary,
} from '../../lib/donorApi'
import './DonorDashboard.css'

export default function DonorDashboard() {
    /* ── State ── */
    const { t } = useTranslation('dashboard')
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [donorProfile, setDonorProfile] = useState(null)
    const [listings, setListings] = useState([])
    const [impact, setImpact] = useState(null)
    const [impactSummary, setImpactSummary] = useState(null)
    const [activeView, setActiveView] = useState('overview')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [dataLoading, setDataLoading] = useState({
        stats: true,
        listings: true,
    })
    const [errors, setErrors] = useState({})
    const contentRef = useRef(null)
    const pollingRef = useRef(null)

    /* ── Fetch all data ── */
    const fetchDashboardData = useCallback(async () => {
        try {
            const [userRes, donorRes, listingsRes, impactRes, impactSummRes] = await Promise.allSettled([
                getCurrentUser(),
                getDonorProfile(),
                getMyListings(),
                getDonorImpact(),
                getImpactSummary(),
            ])

            if (userRes.status === 'fulfilled') setUser(userRes.value.user)
            if (donorRes.status === 'fulfilled') setDonorProfile(donorRes.value.donor)
            if (listingsRes.status === 'fulfilled') setListings(listingsRes.value.listings || [])
            if (impactRes.status === 'fulfilled') setImpact(impactRes.value.impact)
            if (impactSummRes.status === 'fulfilled') setImpactSummary(impactSummRes.value)

            const friendlyError = (reason) => {
                const msg = reason?.message || reason?.error || 'Unknown error'
                if (msg.includes('stack depth') || msg.includes('recursion'))
                    return 'Temporary server issue. Data will refresh shortly.'
                if (msg.includes('not found'))
                    return 'Profile data is unavailable.'
                if (msg.includes('network') || msg.includes('fetch'))
                    return 'Connection issue. Please check your internet.'
                return msg.length < 80 ? msg : 'Something went wrong loading data.'
            }

            const newErrors = {}
            if (userRes.status === 'rejected') newErrors.user = friendlyError(userRes.reason)
            if (listingsRes.status === 'rejected')
                newErrors.listings = friendlyError(listingsRes.reason)
            setErrors(newErrors)
        } catch (err) {
            console.error('Dashboard data fetch error:', err)
        } finally {
            setDataLoading({ stats: false, listings: false })
        }
    }, [])

    /* ── Initial load ── */
    useEffect(() => {
        const init = async () => {
            await fetchDashboardData()
            setLoading(false)
        }

        init()

        // Polling for active status updates (every 30s)
        pollingRef.current = setInterval(() => {
            getMyListings()
                .then((res) => setListings(res.listings || []))
                .catch(() => { })
        }, 30000)

        return () => {
            killAllAnimations()
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [fetchDashboardData])

    /* ── Animate view change ── */
    useEffect(() => {
        if (loading || !contentRef.current) return
        const el = contentRef.current

        gsap.fromTo(
            el,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }
        )
    }, [activeView, loading])

    /* ── Navigation ── */
    const handleNavigate = (viewId) => {
        setActiveView(viewId)
    }

    /* ── After donation success: refresh data ── */
    const handleDonationSuccess = () => {
        fetchDashboardData()
    }

    const handleProfileSave = async (updates) => {
        const result = await updateDonorProfile(updates)
        if (result?.donor) {
            setDonorProfile(result.donor)
            if (result.donor.profiles) {
                setUser((prev) => ({
                    ...prev,
                    full_name: result.donor.profiles.full_name,
                    phone: result.donor.profiles.phone,
                    organization_name: result.donor.profiles.organization_name,
                }))
            }
        }
        return result
    }

    /* ── Derived data ── */
    const activeListings = listings.filter(
        (l) => !['completed', 'expired'].includes(l.status)
    )
    const completedListings = listings.filter((l) => l.status === 'completed')

    const stats = {
        total: listings.length,
        active: activeListings.length,
        completed: completedListings.length,
        ngos: impact?.listing_count ?? 0,
    }

    /* ── View heading config ── */
    const VIEW_CONFIG = {
        overview: { label: t('viewLabels.dashboard'), title: t('viewTitles.yourImpactAtAGlance') },
        'create-donation': { label: t('viewLabels.newDonation'), title: t('viewTitles.createADonation') },
        'active-donations': { label: t('viewLabels.operations'), title: t('viewTitles.activeDonations') },
        tracking: { label: t('viewLabels.tracking'), title: t('viewTitles.trackingMap') },
        history: { label: t('viewLabels.archive'), title: t('viewTitles.donationHistory') },
        profile: { label: t('viewLabels.profile'), title: t('viewTitles.yourProfile') },
    }

    const currentView = VIEW_CONFIG[activeView] || VIEW_CONFIG.overview

    /* ── Loader ── */
    if (loading) {
        return <Loader />
    }

    return (
        <div className={`dd-layout ${sidebarCollapsed ? 'dd-layout--collapsed' : ''}`}>
            {/* ── Sidebar ── */}
            <Sidebar
                activeSection={activeView}
                onNavigate={handleNavigate}
                user={user}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* ── Main Content ── */}
            <main className="dd-content">
                {/* View Header */}
                <header className="dd-view-header">
                    <div className="dd-view-header__left">
                        <span className="dd-view-header__label">{currentView.label}</span>
                        <h1 className="dd-view-header__title">{currentView.title}</h1>
                    </div>
                    <div className="dd-view-header__right">
                        <span className="dd-view-header__date">
                            {new Date().toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    </div>
                </header>

                {/* View Content — only the active view is rendered */}
                <div className="dd-view-content" ref={contentRef} key={activeView}>
                    {activeView === 'overview' && (
                        <div className="dd-view-page">
                            <StatCards stats={stats} loading={dataLoading.stats} />

                            <div className="dd-overview-grid">
                                {/* Carbon Wallet Widget */}
                                <div className="dd-overview-card dd-overview-card--full dd-overview-card--wallet">
                                    <div className="dd-overview-card__header">
                                        <span className="dd-overview-card__label">YOUR CLIMATE IMPACT</span>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <CarbonWallet
                                            impactSummary={impactSummary}
                                            loading={!impactSummary}
                                        />
                                    </div>
                                </div>

                                {/* Recent Activity preview */}
                                <div className="dd-overview-card">
                                    <div className="dd-overview-card__header">
                                        <span className="dd-overview-card__label">RECENT ACTIVITY</span>
                                        <button
                                            className="dd-overview-card__action"
                                            onClick={() => setActiveView('active-donations')}
                                        >
                                            View All →
                                        </button>
                                    </div>
                                    <ActiveTable
                                        listings={activeListings.slice(0, 3)}
                                        loading={dataLoading.listings}
                                        error={errors.listings}
                                    />
                                </div>

                                {/* Quick Map Preview */}
                                <div className="dd-overview-card">
                                    <div className="dd-overview-card__header">
                                        <span className="dd-overview-card__label">LIVE TRACKING</span>
                                        <button
                                            className="dd-overview-card__action"
                                            onClick={() => setActiveView('tracking')}
                                        >
                                            Full Map →
                                        </button>
                                    </div>
                                    <TrackingMap
                                        listings={activeListings}
                                        donorProfile={donorProfile}
                                    />
                                </div>
                            </div>

                            {/* Blog / Inspiration */}
                            <div className="dd-overview-card dd-overview-card--full">
                                <div className="dd-overview-card__header">
                                    <span className="dd-overview-card__label">DISCOVER</span>
                                </div>
                                <BlogPanel />
                            </div>
                        </div>
                    )}

                    {activeView === 'create-donation' && (
                        <div className="dd-view-page">
                            <p className="dd-view-subtitle">
                                Every meal shared is a step towards zero food waste. Fill in the
                                details below and mark the pickup location on the map.
                            </p>
                            <DonationForm onSuccess={handleDonationSuccess} />
                        </div>
                    )}

                    {activeView === 'active-donations' && (
                        <div className="dd-view-page">
                            <ActiveTable
                                listings={activeListings}
                                loading={dataLoading.listings}
                                error={errors.listings}
                            />
                        </div>
                    )}

                    {activeView === 'tracking' && (
                        <div className="dd-view-page">
                            <p className="dd-view-subtitle">
                                Monitor your active donations in real time. Pickup locations and
                                NGO markers are displayed live.
                            </p>
                            <TrackingMap
                                listings={activeListings}
                                donorProfile={donorProfile}
                            />
                        </div>
                    )}

                    {activeView === 'history' && (
                        <div className="dd-view-page">
                            <HistoryTable
                                listings={completedListings}
                                loading={dataLoading.listings}
                                error={errors.listings}
                            />
                        </div>
                    )}

                    {activeView === 'profile' && (
                        <div className="dd-view-page">
                            <ProfileSection
                                user={user}
                                donorProfile={donorProfile}
                                impact={impact}
                                onSave={handleProfileSave}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
