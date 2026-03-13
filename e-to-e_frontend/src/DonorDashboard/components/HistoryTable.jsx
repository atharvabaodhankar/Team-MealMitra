import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { animateHistoryRows } from '../animations/dashboardAnimations'
import { SkeletonTable } from './Loader'

function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function HistoryTable({ listings, loading, error }) {
    const { t } = useTranslation('dashboard')
    
    useEffect(() => {
        if (!loading && listings?.length > 0) {
            setTimeout(() => animateHistoryRows(), 100)
        }
    }, [loading, listings])

    if (loading) return <SkeletonTable rows={5} />

    if (error) {
        return (
            <div className="dd-empty-state">
                <span className="dd-empty-state__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </span>
                <p>{t('failedToLoadHistory')}</p>
                <p className="dd-empty-state__sub">{error}</p>
            </div>
        )
    }

    if (!listings || listings.length === 0) {
        return (
            <div className="dd-empty-state">
                <span className="dd-empty-state__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </span>
                <p>{t('noCompletedDonations')}</p>
                <p className="dd-empty-state__sub">
                    {t('completedDonationsWillAppear')}
                </p>
            </div>
        )
    }

    return (
        <div className="dd-table-wrap dd-history-table">
            <table className="dd-table">
                <thead>
                    <tr>
                        <th>{t('date')}</th>
                        <th>{t('foodType')}</th>
                        <th>{t('quantity')}</th>
                        <th>{t('meals')}</th>
                        <th>{t('status')}</th>
                    </tr>
                </thead>
                <tbody>
                    {listings.map((item, i) => (
                        <tr key={item.listing_id || i} className="dd-history-row">
                            <td>{formatDate(item.created_at)}</td>
                            <td className="dd-table__food">{item.food_type}</td>
                            <td>{item.quantity_kg} kg</td>
                            <td>{item.meal_equivalent ?? '—'}</td>
                            <td>
                                <span className="dd-status-badge dd-status--completed">
                                    {t('completed')}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
