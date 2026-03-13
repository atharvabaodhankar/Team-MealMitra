import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Package, Clock } from 'lucide-react'

function timeAgo(date) {
    if (!date) return '—'
    const now = new Date()
    const diff = Math.floor((now - new Date(date)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(date).toLocaleDateString()
}

function expiryLabel(expiryTs) {
    if (!expiryTs) return { text: '—', urgent: false }
    const now = new Date()
    const exp = new Date(expiryTs)
    const diff = exp - now
    if (diff <= 0) return { text: 'Expired', urgent: true, expired: true }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const urgent = diff < 2 * 3600000
    if (h === 0) return { text: `${m}m left`, urgent }
    return { text: `${h}h ${m}m left`, urgent }
}

const STATUS_FILTERS = ['all', 'open', 'claimed', 'completed']

export default function DonationMonitor({ listings }) {
    const listRef = useRef(null)
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        if (!listRef.current) return
        const raf = requestAnimationFrame(() => {
            const items = listRef.current?.querySelectorAll('.admin-donation-item')
            if (!items || items.length === 0) return
            // Pre-set items as fully visible before animating in
            gsap.set(items, { opacity: 1, x: 0 })
            gsap.from(items, {
                x: 20,
                opacity: 0,
                duration: 0.3,
                stagger: 0.04,
                ease: 'power2.out',
                clearProps: 'all',
            })
        })
        return () => cancelAnimationFrame(raf)
    }, [listings, statusFilter])

    const filtered = [...(listings || [])].filter(l => {
        if (statusFilter === 'all') return true
        if (statusFilter === 'claimed') return ['claimed', 'scheduled', 'in_discussion', 'in_transit'].includes(l.status)
        return l.status === statusFilter
    })

    const sorted = filtered.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ).slice(0, 20)

    return (
        <div className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">Live Donations</h2>
                    <p className="admin-section__subtitle">Real-time donation stream</p>
                </div>
                <div className="admin-section__actions">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {listings?.length || 0} total
                    </span>
                </div>
            </div>

            {/* Status filter tabs */}
            <div className="admin-table-toolbar" style={{ paddingBottom: '0.5rem' }}>
                {STATUS_FILTERS.map(s => (
                    <button
                        key={s}
                        className={`admin-filter-btn ${statusFilter === s ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {s === 'all' ? 'All' :
                         s === 'claimed' ? 'In Progress' :
                         s === 'completed' ? 'Completed' : 'Open'}
                    </button>
                ))}
            </div>

            <div className="admin-donation-stream">
                {sorted.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <Package size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">No donations for this filter.</p>
                        <p className="admin-empty__hint">Donations will appear here as donors list food items.</p>
                    </div>
                ) : (
                    <div ref={listRef} style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {sorted.map(listing => {
                            const expiry = expiryLabel(listing.expiry_time)
                            const donorName = listing.donors?.profiles?.organization_name
                                || listing.donors?.city
                                || '—'
                            const address = listing.pickup_address
                                ? listing.pickup_address.length > 35
                                    ? listing.pickup_address.slice(0, 35) + '…'
                                    : listing.pickup_address
                                : '—'

                            return (
                                <div key={listing.listing_id} className="admin-donation-item">
                                    <div className="admin-donation-item__id">
                                        #{(listing.listing_id || '').slice(0, 8)}
                                    </div>
                                    <div className="admin-donation-item__info" style={{ flex: 1 }}>
                                        <div className="admin-donation-item__donor" style={{ fontWeight: 600 }}>
                                            {listing.food_type || 'Food'} &mdash; {listing.quantity_kg || 0} kg
                                        </div>
                                        <div className="admin-donation-item__ngo" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                            <span style={{ marginRight: 8 }}>📍 {address}</span>
                                            <span style={{ opacity: 0.8 }}>by {donorName}</span>
                                        </div>
                                    </div>
                                    <div className="admin-donation-item__meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <span className={`admin-badge admin-badge--${listing.status || 'open'}`}>
                                            <span className="admin-badge__dot" />
                                            {listing.status || 'open'}
                                        </span>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            fontSize: '0.68rem',
                                            color: expiry.expired ? '#e74c3c' : expiry.urgent ? '#f39c12' : 'var(--text-muted)',
                                            fontWeight: expiry.urgent ? 600 : 400,
                                        }}>
                                            <Clock size={10} />
                                            {expiry.text}
                                        </div>
                                        <div className="admin-donation-item__time" style={{ fontSize: '0.65rem' }}>
                                            {timeAgo(listing.created_at)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}