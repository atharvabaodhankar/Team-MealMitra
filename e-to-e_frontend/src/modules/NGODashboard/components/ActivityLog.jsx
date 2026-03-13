import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNGO } from '../context/NGOContext'
import { animateRowsStagger } from '../animations/ngoAnimations'

export default function ActivityLog() {
    const { t } = useTranslation('dashboard')
    const { activityLog } = useNGO()

    const EVENT_LABELS = {
        claim_created: t('ngo.donationClaimed'),
        claim_cancelled: t('ngo.claimCancelled'),
        claim_status_changed: t('ngo.claimStatusChanged'),
        delivery_assigned: t('ngo.volunteerAssigned'),
        delivery_status_updated: t('ngo.deliveryUpdated'),
        volunteer_added: t('ngo.volunteerAdded'),
        volunteer_updated: t('ngo.volunteerUpdated'),
        volunteer_removed: t('ngo.volunteerRemoved'),
        new_donation_detected: t('ngo.newDonation'),
    }

    const EVENT_ICONS = {
        claim_created: '✓',
        claim_cancelled: '✕',
        claim_status_changed: '⟳',
        delivery_assigned: '◉',
        delivery_status_updated: '↑',
        volunteer_added: '+',
        volunteer_updated: '✎',
        volunteer_removed: '−',
        new_donation_detected: '↓',
    }

    useEffect(() => {
        if (activityLog.length > 0) {
            animateRowsStagger('.ngo-log-row')
        }
    }, [activityLog])

    if (activityLog.length === 0) {
        return (
            <div className="ngo-empty-state">
                <span className="ngo-empty-state__icon">☰</span>
                <h4>{t('ngo.noActivityYet')}</h4>
                <p>{t('ngo.actionsWillBeLogged')}</p>
            </div>
        )
    }

    return (
        <div className="ngo-table-wrap ngo-scroll-table">
            <table className="ngo-table">
                <thead>
                    <tr>
                        <th>{t('ngo.time')}</th>
                        <th>{t('ngo.event')}</th>
                        <th>{t('ngo.details')}</th>
                    </tr>
                </thead>
                <tbody>
                    {activityLog.map((log) => (
                        <tr key={log.id} className="ngo-log-row">
                            <td>
                                <span className="ngo-cell-sub">
                                    {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>
                            </td>
                            <td>
                                <div className="ngo-log-event">
                                    <span className="ngo-log-event__icon">
                                        {EVENT_ICONS[log.event_type] || '•'}
                                    </span>
                                    <span>{EVENT_LABELS[log.event_type] || log.event_type}</span>
                                </div>
                            </td>
                            <td>
                                <span className="ngo-cell-sub">
                                    {log.listing_id && `${t('ngo.listing')}: ${log.listing_id.slice(0, 8)}…`}
                                    {log.claim_id && `${t('ngo.claim')}: ${log.claim_id.slice(0, 8)}…`}
                                    {log.volunteer_id && `${t('ngo.vol')}: ${log.volunteer_id.slice(0, 8)}…`}
                                    {log.delivery_id && `${t('ngo.del')}: ${log.delivery_id.slice(0, 8)}…`}
                                    {log.volunteer_name && log.volunteer_name}
                                    {log.food_type && log.food_type}
                                    {log.status && ` → ${log.status}`}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
