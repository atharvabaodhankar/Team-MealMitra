import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNGO } from '../context/NGOContext'
import { animateRowsStagger, animateButtonPress, playSuccessRing, flashRow } from '../animations/ngoAnimations'

export default function AcceptedPickups() {
    const { t } = useTranslation('dashboard')
    const {
        claims,
        deliveries,
        volunteers,
        loading,
        errors,
        handleAssignDelivery,
        handleReassignDelivery,
        handleUpdateDeliveryStatus,
        handleCancelClaim,
        fetchClaims,
    } = useNGO()

    const [assigningClaimId, setAssigningClaimId] = useState(null)
    const [selectedVolunteer, setSelectedVolunteer] = useState('')

    useEffect(() => {
        if (!loading.claims && claims.length > 0) {
            animateRowsStagger('.ngo-pickup-row')
        }
    }, [claims, loading.claims])

    /* Find delivery for a claim */
    function getDeliveryForClaim(claimId) {
        return deliveries.find((d) => d.claim_id === claimId) || null
    }

    /* Available volunteers (availability_status = true) */
    const availableVolunteers = volunteers.filter((v) => v.availability_status)

    const handleAssign = useCallback(
        async (claimId, deliveryId, e) => {
            if (!selectedVolunteer) return
            animateButtonPress(e.currentTarget)
            try {
                if (deliveryId) {
                    await handleReassignDelivery(deliveryId, selectedVolunteer)
                } else {
                    await handleAssignDelivery(claimId, selectedVolunteer)
                }
                const row = e.currentTarget.closest('tr')
                if (row) {
                    playSuccessRing(row)
                    flashRow(row)
                }
                setAssigningClaimId(null)
                setSelectedVolunteer('')
            } catch {
                /* handled in context */
            }
        },
        [selectedVolunteer, handleAssignDelivery, handleReassignDelivery]
    )

    const handleStatusUpdate = useCallback(
        async (deliveryId, newStatus, e) => {
            animateButtonPress(e.currentTarget)
            try {
                await handleUpdateDeliveryStatus(deliveryId, newStatus)
                const row = e.currentTarget.closest('tr')
                if (row) flashRow(row)
            } catch {
                /* handled in context */
            }
        },
        [handleUpdateDeliveryStatus]
    )

    const handleCancel = useCallback(
        async (claimId, e) => {
            animateButtonPress(e.currentTarget)
            if (!window.confirm(t('ngo.cancelClaim'))) return
            try {
                await handleCancelClaim(claimId)
            } catch {
                /* handled in context */
            }
        },
        [handleCancelClaim, t]
    )

    function getStatusBadge(claim, delivery) {
        if (delivery) {
            const statusMap = {
                assigned: 'ngo-badge--info',
                in_transit: 'ngo-badge--warning',
                delivered: 'ngo-badge--success',
                failed: 'ngo-badge--error',
            }
            return (
                <span className={`ngo-badge ${statusMap[delivery.delivery_status] || ''}`}>
                    {t(`ngo.${delivery.delivery_status}`, { defaultValue: delivery.delivery_status?.replace('_', ' ') || '—' })}
                </span>
            )
        }
        const claimStatusMap = {
            claimed: 'ngo-badge--info',
            scheduled: 'ngo-badge--warning',
            picked: 'ngo-badge--success',
            completed: 'ngo-badge--success',
        }
        return (
            <span className={`ngo-badge ${claimStatusMap[claim.status] || ''}`}>
                {t(`ngo.${claim.status}`, { defaultValue: claim.status || '—' })}
            </span>
        )
    }

    if (loading.claims && claims.length === 0) {
        return (
            <div className="ngo-table-wrap">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="ngo-skeleton-row"><div className="ngo-skeleton-line" /></div>
                ))}
            </div>
        )
    }

    if (errors.claims) {
        return (
            <div className="ngo-error-state">
                <span className="ngo-error-state__icon">⚠</span>
                <p>{errors.claims}</p>
                <button className="ngo-btn ngo-btn--outline" onClick={fetchClaims}>{t('retry', { ns: 'common' })}</button>
            </div>
        )
    }

    if (claims.length === 0) {
        return (
            <div className="ngo-empty-state">
                <span className="ngo-empty-state__icon">✓</span>
                <h4>{t('ngo.noAcceptedPickupsYet')}</h4>
                <p>{t('ngo.acceptIncomingDonations')}</p>
            </div>
        )
    }

    return (
        <div className="ngo-table-wrap ngo-scroll-table">
            <table className="ngo-table">
                <thead>
                    <tr>
                        <th>{t('ngo.donation')}</th>
                        <th>{t('ngo.donor')}</th>
                        <th>{t('ngo.pickupTime')}</th>
                        <th>{t('status')}</th>
                        <th>{t('ngo.volunteer')}</th>
                        <th>{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {claims.map((claim) => {
                        const delivery = getDeliveryForClaim(claim.claim_id)
                        const listing = claim.food_listings || {}
                        const donorName = listing.donors?.profiles?.organization_name || '—'
                        const donorPhone = listing.donors?.profiles?.phone || '—'
                        const volunteerName = delivery?.volunteers?.full_name || null

                        return (
                            <tr key={claim.claim_id} className="ngo-pickup-row">
                                <td>
                                    <div className="ngo-cell-main">{listing.food_type || '—'}</div>
                                    <div className="ngo-cell-sub">{listing.quantity_kg ? `${listing.quantity_kg} kg` : ''}</div>
                                </td>
                                <td>
                                    <div className="ngo-cell-main">{donorName}</div>
                                    <div className="ngo-cell-sub">{donorPhone}</div>
                                </td>
                                <td>
                                    {claim.pickup_scheduled_time
                                        ? new Date(claim.pickup_scheduled_time).toLocaleString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : '—'}
                                </td>
                                <td>{getStatusBadge(claim, delivery)}</td>
                                <td>
                                    {volunteerName && assigningClaimId !== claim.claim_id ? (
                                        <div className="ngo-volunteer-cell">
                                            <span className="ngo-cell-main">{volunteerName}</span>
                                            {delivery && ['assigned', 'in_transit'].includes(delivery.delivery_status) && (
                                                <button
                                                    className="ngo-btn-icon-sm"
                                                    onClick={() => {
                                                        setAssigningClaimId(claim.claim_id)
                                                        setSelectedVolunteer(delivery.volunteer_id || '')
                                                    }}
                                                    title={t('ngo.changeVolunteer')}
                                                    style={{ marginLeft: '8px', opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none' }}
                                                >
                                                    ✎
                                                </button>
                                            )}
                                        </div>
                                    ) : assigningClaimId === claim.claim_id ? (
                                        <div className="ngo-assign-inline">
                                            <select
                                                className="ngo-select"
                                                value={selectedVolunteer}
                                                onChange={(e) => setSelectedVolunteer(e.target.value)}
                                            >
                                                <option value="">{t('ngo.select')}</option>
                                                {availableVolunteers.map((v) => (
                                                    <option key={v.volunteer_id} value={v.volunteer_id}>
                                                        {v.full_name} ({v.vehicle_type || 'N/A'})
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="ngo-btn ngo-btn--sm ngo-btn--accept"
                                                onClick={(e) => handleAssign(claim.claim_id, delivery?.delivery_id, e)}
                                                disabled={!selectedVolunteer || loading.action}
                                            >
                                                {t('ngo.go')}
                                            </button>
                                            <button
                                                className="ngo-btn ngo-btn--sm ngo-btn--ghost"
                                                onClick={() => { setAssigningClaimId(null); setSelectedVolunteer('') }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="ngo-btn ngo-btn--sm ngo-btn--outline"
                                            onClick={() => setAssigningClaimId(claim.claim_id)}
                                            disabled={loading.action}
                                        >
                                            {t('ngo.assign')}
                                        </button>
                                    )}
                                </td>
                                <td>
                                    <div className="ngo-action-btns">
                                        {delivery && delivery.delivery_status === 'assigned' && (
                                            <button
                                                className="ngo-btn ngo-btn--sm ngo-btn--outline"
                                                onClick={(e) => handleStatusUpdate(delivery.delivery_id, 'in_transit', e)}
                                                disabled={loading.action}
                                            >
                                                {t('ngo.inTransit')}
                                            </button>
                                        )}
                                        {delivery && delivery.delivery_status === 'in_transit' && (
                                            <button
                                                className="ngo-btn ngo-btn--sm ngo-btn--accept"
                                                onClick={(e) => handleStatusUpdate(delivery.delivery_id, 'delivered', e)}
                                                disabled={loading.action}
                                            >
                                                {t('ngo.delivered')}
                                            </button>
                                        )}
                                        {!delivery && (
                                            <button
                                                className="ngo-btn ngo-btn--sm ngo-btn--ghost"
                                                onClick={(e) => handleCancel(claim.claim_id, e)}
                                                disabled={loading.action}
                                            >
                                                {t('cancel', { ns: 'common' })}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
