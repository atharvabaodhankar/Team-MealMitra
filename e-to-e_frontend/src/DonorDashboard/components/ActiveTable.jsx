import { useEffect } from 'react'
import { animateActiveRows } from '../animations/dashboardAnimations'
import { SkeletonTable } from './Loader'

const STATUS_MAP = {
    open: { label: 'Open', className: 'dd-status--pending' },
    in_discussion: { label: 'In Discussion', className: 'dd-status--accepted' },
    claimed: { label: 'Claimed', className: 'dd-status--assigned' },
    scheduled: { label: 'Pickup Scheduled', className: 'dd-status--in-progress' },
    picked: { label: 'Picked Up', className: 'dd-status--in-progress' },
    completed: { label: 'Completed', className: 'dd-status--completed' },
    expired: { label: 'Expired', className: 'dd-status--cancelled' },
}

function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function ActiveTable({ listings, loading, error }) {
    useEffect(() => {
        if (!loading && listings?.length > 0) {
            setTimeout(() => animateActiveRows(), 100)
        }
    }, [loading, listings])

    if (loading) return <SkeletonTable rows={4} />

    if (error) {
        return (
            <div className="dd-empty-state">
                <span className="dd-empty-state__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </span>
                <p>Failed to load active donations.</p>
                <p className="dd-empty-state__sub">{error}</p>
            </div>
        )
    }

    if (!listings || listings.length === 0) {
        return (
            <div className="dd-empty-state">
                <span className="dd-empty-state__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                </span>
                <p>No active donations yet.</p>
                <p className="dd-empty-state__sub">
                    Create a donation above to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="dd-table-wrap">
            <table className="dd-table dd-active-table">
                <thead>
                    <tr>
                        <th>Food</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Expiry</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {listings.map((item) => {
                        const statusInfo = STATUS_MAP[item.status] || {
                            label: item.status,
                            className: '',
                        }
                        return (
                            <tr key={item.listing_id} className="dd-active-row">
                                <td className="dd-table__food">{item.food_type}</td>
                                <td>{item.quantity_kg} kg</td>
                                <td>
                                    <span className={`dd-status-badge ${statusInfo.className}`}>
                                        {statusInfo.label}
                                    </span>
                                </td>
                                <td>{formatDate(item.expiry_time)}</td>
                                <td>{formatDate(item.created_at)}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
