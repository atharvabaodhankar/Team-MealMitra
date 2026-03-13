import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from 'gsap'
import { Search, Handshake, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { verifyDonor } from '../lib/adminApi'

function formatDate(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    let hours = d.getHours()
    const mins = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${day} ${mon} ${year}, ${hours}:${mins} ${ampm}`
}

export default function DonorManagement({ donors, onRefresh }) {
    const { t } = useTranslation('dashboard')
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [actionLoading, setActionLoading] = useState(null)
    const [expandedId, setExpandedId] = useState(null)
    const tableRef = useRef(null)

    useEffect(() => {
        if (!tableRef.current) return
        const raf = requestAnimationFrame(() => {
            const rows = tableRef.current?.querySelectorAll('tbody tr.donor-main-row')
            if (!rows || rows.length === 0) return
            gsap.set(rows, { opacity: 1, y: 0 })
            gsap.from(rows, {
                y: 16,
                opacity: 0,
                duration: 0.3,
                stagger: 0.04,
                ease: 'power2.out',
                clearProps: 'all',
            })
        })
        return () => cancelAnimationFrame(raf)
    }, [donors, filter, search])

    const handleApprove = useCallback(async (donorId) => {
        setActionLoading(donorId)
        try {
            await verifyDonor(donorId, true)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to approve donor:', err)
            alert(t('failedToApproveDonor', { error: err.message || err.error || 'Unknown error' }))
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh, t])

    const handleDeny = useCallback(async (donorId) => {
        if (!confirm(t('areYouSureDenyDonor'))) return
        setActionLoading(donorId)
        try {
            await verifyDonor(donorId, false)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to deny donor:', err)
            alert(t('failedToDenyDonor', { error: err.message || err.error || 'Unknown error' }))
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh, t])

    const handleRevoke = useCallback(async (donorId) => {
        if (!confirm('Are you sure you want to revoke this donor\'s verification?')) return
        setActionLoading(donorId)
        try {
            await verifyDonor(donorId, false)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to revoke donor:', err)
            alert(`Failed to revoke donor: ${err.message || err.error || 'Unknown error'}`)
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh])

    const toggleExpand = (donorId) => {
        setExpandedId(prev => prev === donorId ? null : donorId)
    }

    const filtered = donors.filter(d => {
        const name = d.profiles?.organization_name || ''
        const city = d.city || ''
        const matchSearch = !search ||
            name.toLowerCase().includes(search.toLowerCase()) ||
            city.toLowerCase().includes(search.toLowerCase())

        const matchFilter = filter === 'all' ||
            (filter === 'verified' && d.verification_status) ||
            (filter === 'unverified' && !d.verification_status)

        return matchSearch && matchFilter
    })

    return (
        <section className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">{t('donorManagement')}</h2>
                    <p className="admin-section__subtitle">{t('donorsRegistered', { count: donors.length })}</p>
                </div>
            </div>

            <div className="admin-table-wrap" ref={tableRef}>
                <div className="admin-table-toolbar">
                    <div className="admin-search">
                        <span className="admin-search__icon">
                            <Search size={14} strokeWidth={1.8} />
                        </span>
                        <input
                            type="text"
                            className="admin-search__input"
                            placeholder={t('searchDonorsByNameOrCity')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button
                        className={`admin-filter-btn ${filter === 'all' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        {t('all')}
                    </button>
                    <button
                        className={`admin-filter-btn ${filter === 'verified' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('verified')}
                    >
                        <Check size={12} strokeWidth={2.5} style={{ marginRight: 4 }} />
                        {t('verified')}
                    </button>
                    <button
                        className={`admin-filter-btn ${filter === 'unverified' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('unverified')}
                    >
                        Pending
                    </button>
                </div>

                {filtered.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <Handshake size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">
                            {filter === 'verified' ? t('noVerifiedDonorsYet') :
                                filter === 'unverified' ? t('noPendingDonorRegistrations') :
                                    t('noDonorsFound')}
                        </p>
                        <p className="admin-empty__hint">
                            {search ? t('tryAdjustingSearchQuery') : t('donorsWillAppearHere')}
                        </p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('organization')}</th>
                                <th>{t('businessType')}</th>
                                <th>{t('city')}</th>
                                <th>{t('status')}</th>
                                <th>{t('registered')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(d => (
                                <>
                                    <tr key={d.donor_id} className="donor-main-row">
                                        <td style={{ fontWeight: 600 }}>
                                            {d.profiles?.organization_name || '—'}
                                        </td>
                                        <td>{d.business_type || '—'}</td>
                                        <td>{d.city || '—'}</td>
                                        <td>
                                            <span className={`admin-badge ${d.verification_status ? 'admin-badge--verified' : 'admin-badge--pending'}`}>
                                                <span className="admin-badge__dot" />
                                                {d.verification_status ? t('verified') : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="admin-log-timestamp">
                                            {formatDate(d.created_at)}
                                        </td>
                                        <td>
                                            <div className="admin-actions-cell">
                                                {/* View toggle */}
                                                <button
                                                    className="admin-action-btn admin-action-btn--view"
                                                    onClick={() => toggleExpand(d.donor_id)}
                                                    title="View details"
                                                >
                                                    {expandedId === d.donor_id
                                                        ? <ChevronUp size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                        : <ChevronDown size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                    }
                                                    {expandedId === d.donor_id ? 'Hide' : t('view')}
                                                </button>

                                                {/* Approve / Deny for unverified */}
                                                {!d.verification_status && (
                                                    <>
                                                        <button
                                                            className="admin-action-btn admin-action-btn--approve"
                                                            onClick={() => handleApprove(d.donor_id)}
                                                            disabled={actionLoading === d.donor_id}
                                                        >
                                                            <Check size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                            {actionLoading === d.donor_id ? t('approving') : t('approve')}
                                                        </button>
                                                        <button
                                                            className="admin-action-btn admin-action-btn--deny"
                                                            onClick={() => handleDeny(d.donor_id)}
                                                            disabled={actionLoading === d.donor_id}
                                                        >
                                                            <X size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                            {t('deny')}
                                                        </button>
                                                    </>
                                                )}

                                                {/* Revoke for verified donors */}
                                                {d.verification_status && (
                                                    <button
                                                        className="admin-action-btn admin-action-btn--suspend"
                                                        onClick={() => handleRevoke(d.donor_id)}
                                                        disabled={actionLoading === d.donor_id}
                                                    >
                                                        <X size={12} strokeWidth={2} style={{ marginRight: 3 }} />
                                                        {actionLoading === d.donor_id ? 'Revoking…' : 'Revoke'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded detail row */}
                                    {expandedId === d.donor_id && (
                                        <tr key={`${d.donor_id}-detail`} className="donor-detail-row">
                                            <td colSpan={6} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.25rem' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem 1.5rem', fontSize: '0.78rem' }}>
                                                    <div>
                                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                                                        <span>{d.profiles?.email || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</span>
                                                        <span>{d.profiles?.phone || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</span>
                                                        <span>{d.address || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CSR Participant</span>
                                                        <span>{d.csr_participant ? '✓ Yes' : 'No'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coordinates</span>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                                            {d.latitude && d.longitude ? `${parseFloat(d.latitude).toFixed(4)}, ${parseFloat(d.longitude).toFixed(4)}` : 'Not set'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    )
}