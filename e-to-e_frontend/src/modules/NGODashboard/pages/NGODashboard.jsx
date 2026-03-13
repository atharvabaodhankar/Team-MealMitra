import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NGOProvider, useNGO } from '../context/NGOContext'
import Sidebar from '../components/Sidebar'
import OverviewCards from '../components/OverviewCards'
import IncomingDonations from '../components/IncomingDonations'
import AcceptedPickups from '../components/AcceptedPickups'
import VolunteerManager from '../components/VolunteerManager'
import MapPanel from '../components/MapPanel'
import ActivityLog from '../components/ActivityLog'
import FoodRequest from '../components/FoodRequest'
import NotificationToast from '../components/NotificationToast'
import { useSocket } from '../../../context/SocketContext'
import { Bell, X } from 'lucide-react'
import { runPageLoadSequence, animateViewEnter, killAllAnimations } from '../animations/ngoAnimations'
import { CarbonWallet } from '../../../components/CarbonWallet'
import './NGODashboard.css'

function DashboardInner() {
    const { t } = useTranslation('dashboard')
    const { loading, errors, ngoProfile, fetchListings, impactSummary } = useNGO()
    const socket = useSocket()
    const [activeView, setActiveView] = useState('overview')
    const [collapsed, setCollapsed] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [alerts, setAlerts] = useState([])
    const contentRef = useRef(null)
    const hasAnimated = useRef(false)

    const VIEW_TITLES = {
        overview: t('ngo.operationsOverview'),
        incoming: t('ngo.incomingDonations'),
        pickups: t('ngo.acceptedPickups'),
        volunteers: t('ngo.volunteerManagement'),
        map: t('ngo.operationsMap'),
        log: t('ngo.activityLog'),
        'food-request': t('ngo.foodRequest', 'Targeted Food Request'),
    }

    const VIEW_SUBTITLES = {
        overview: t('ngo.realtimeLogisticsCenter'),
        incoming: t('ngo.availableFoodDonations'),
        pickups: t('ngo.manageClaimedDonations'),
        volunteers: t('ngo.addEditManageVolunteers'),
        map: t('ngo.liveMapShowingDonations'),
        log: t('ngo.sessionActivityHistory'),
        'food-request': t('ngo.searchDonorInventory', 'Search donor inventory and request specific items'),
    }

    /* Cinematic page load */
    useEffect(() => {
        if (!loading.initial && !hasAnimated.current) {
            hasAnimated.current = true
            setTimeout(() => runPageLoadSequence(), 20)
        }
    }, [loading.initial])

    /* Socket Listeners */
    useEffect(() => {
        if (!socket) return

        const handleNewDonation = (data) => {
            setAlerts(prev => [{
                id: Date.now(),
                ...data,
                read: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }, ...prev])

            // Auto-refresh listings in context
            if (fetchListings) fetchListings()
        }

        socket.on('new_donation', handleNewDonation)
        return () => socket.off('new_donation', handleNewDonation)
    }, [socket, fetchListings])

    /* View transition animation */
    useEffect(() => {
        if (contentRef.current) animateViewEnter(contentRef.current)
    }, [activeView])

    /* Cleanup */
    useEffect(() => {
        return () => killAllAnimations()
    }, [])

    /* Responsive collapse */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setCollapsed(true)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const unreadCount = alerts.filter(a => !a.read).length

    const markAsRead = () => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })))
    }

    /* Initial loading state */
    if (loading.initial) {
        return (
            <div className="ngo-loading-screen">
                <div className="ngo-loading-spinner" />
                <p>{t('ngo.loadingNGODashboard')}</p>
            </div>
        )
    }

    /* Init error */
    if (errors.init || errors.profile) {
        return (
            <div className="ngo-loading-screen">
                <div className="ngo-error-state">
                    <span className="ngo-error-state__icon">⚠</span>
                    <h3>{t('ngo.failedToLoadDashboard')}</h3>
                    <p>{errors.init || errors.profile}</p>
                    <button className="ngo-btn ngo-btn--primary" onClick={() => window.location.reload()}>
                        {t('retry', { ns: 'common' })}
                    </button>
                </div>
            </div>
        )
    }

    function renderView() {
        switch (activeView) {
            case 'overview':
                return (
                    <div id="ngo-overview-view">
                        <OverviewCards />
                        <div className="ngo-section-divider" />

                        {/* Carbon Wallet Widget */}
                        <div className="ngo-overview-panel ngo-overview-panel--wallet" style={{ marginBottom: '1.5rem' }}>
                            <div className="ngo-panel-header">
                                <span className="ngo-panel-label">VERIFIED ENVIRONMENTAL IMPACT</span>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <CarbonWallet
                                    impactSummary={impactSummary}
                                    loading={!impactSummary}
                                />
                            </div>
                        </div>

                        <div className="ngo-overview-panels">
                            <div className="ngo-overview-panel">
                                <h4 className="ngo-panel-title">{t('ngo.recentIncoming')}</h4>
                                <IncomingDonations />
                            </div>
                            <div className="ngo-overview-panel">
                                <h4 className="ngo-panel-title">{t('ngo.activePickups')}</h4>
                                <AcceptedPickups />
                            </div>
                        </div>
                    </div>
                )
            case 'incoming':
                return <IncomingDonations />
            case 'pickups':
                return <AcceptedPickups />
            case 'volunteers':
                return <VolunteerManager />
            case 'map':
                return <MapPanel />
            case 'log':
                return <ActivityLog />
            case 'food-request':
                return <FoodRequest />
            default:
                return <OverviewCards />
        }
    }

    return (
        <div className={`ngo-layout ${collapsed ? 'ngo-layout--collapsed' : ''}`}>
            <Sidebar
                activeView={activeView}
                onViewChange={setActiveView}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((c) => !c)}
            />

            <main className="ngo-content">
                <div className="ngo-view-header">
                    <div>
                        <h2 className="ngo-view-title">{VIEW_TITLES[activeView]}</h2>
                        <p className="ngo-view-subtitle">{VIEW_SUBTITLES[activeView]}</p>
                    </div>
                    <div className="ngo-view-header__meta">
                        {/* Notification Bell */}
                        <div className="ngo-notification-wrapper">
                            <button
                                className={`ngo-notification-btn ${unreadCount > 0 ? 'ngo-notification-btn--active' : ''}`}
                                onClick={() => {
                                    setShowNotifications(!showNotifications)
                                    if (!showNotifications) markAsRead()
                                }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="ngo-notification-count">{unreadCount}</span>}
                            </button>

                            {showNotifications && (
                                <div className="ngo-notification-dropdown">
                                    <div className="ngo-notification-dropdown__header">
                                        <h4>{t('ngo.notifications')}</h4>
                                        <button onClick={() => setShowNotifications(false)}><X size={16} /></button>
                                    </div>
                                    <div className="ngo-notification-dropdown__body">
                                        {alerts.length === 0 ? (
                                            <p className="ngo-notification-empty">{t('ngo.noNewNotifications')}</p>
                                        ) : (
                                            alerts.map(alert => (
                                                <div key={alert.id} className="ngo-notification-item">
                                                    <div className="ngo-notification-item__icon">🍱</div>
                                                    <div className="ngo-notification-item__content">
                                                        <p dangerouslySetInnerHTML={{
                                                            __html: t('ngo.userDonatedFood', {
                                                                donorName: alert.donor_name,
                                                                quantity: alert.quantity_kg,
                                                                foodType: alert.food_type
                                                            })
                                                        }} />
                                                        <span>{alert.time}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <span className="ngo-live-dot" />
                        <span className="ngo-live-label">{t('ngo.live')}</span>
                    </div>
                </div>

                <div ref={contentRef} className="ngo-view-body">
                    {renderView()}
                </div>
            </main>

            <NotificationToast />
        </div>
    )
}

export default function NGODashboard() {
    return (
        <NGOProvider>
            <DashboardInner />
        </NGOProvider>
    )
}
