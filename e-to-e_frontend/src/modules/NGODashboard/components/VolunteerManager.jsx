import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNGO } from '../context/NGOContext'
import { animateRowsStagger, animateButtonPress } from '../animations/ngoAnimations'

// vehicle_type enum from DB: 'bike', 'scooter', 'car', 'van', 'truck'
const VEHICLE_TYPES = ['bike', 'scooter', 'car', 'van', 'truck']

const INITIAL_FORM = {
    full_name: '',
    phone: '',
    vehicle_type: '',
}

export default function VolunteerManager() {
    const { t } = useTranslation('dashboard')
    const {
        volunteers,
        deliveries,
        loading,
        errors,
        handleAddVolunteer,
        handleUpdateVolunteer,
        handleRemoveVolunteer,
        fetchVolunteers,
    } = useNGO()

    const [form, setForm] = useState(INITIAL_FORM)
    const [formError, setFormError] = useState('')
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        if (!loading.volunteers && volunteers.length > 0) {
            animateRowsStagger('.ngo-vol-row')
        }
    }, [volunteers, loading.volunteers])

    /* Find current assignment for a volunteer */
    function getCurrentAssignment(volunteerId) {
        const active = deliveries.find(
            (d) =>
                d.volunteer_id === volunteerId &&
                ['assigned', 'in_transit'].includes(d.delivery_status)
        )
        if (!active) return null
        const foodType = active.ngo_claims?.food_listings?.food_type || t('ngo.delivery')
        return `${foodType} (${t(`ngo.${active.delivery_status}`, { defaultValue: active.delivery_status?.replace('_', ' ') })})`
    }

    function handleFormChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        setFormError('')
    }

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault()
            if (!form.full_name.trim() || !form.phone.trim()) {
                setFormError(t('ngo.nameAndPhoneRequired'))
                return
            }

            try {
                if (editingId) {
                    await handleUpdateVolunteer(editingId, {
                        full_name: form.full_name,
                        phone: form.phone,
                        vehicle_type: form.vehicle_type || null,
                    })
                    setEditingId(null)
                } else {
                    await handleAddVolunteer({
                        full_name: form.full_name,
                        phone: form.phone,
                        vehicle_type: form.vehicle_type || null,
                    })
                }
                setForm(INITIAL_FORM)
            } catch {
                /* handled in context */
            }
        },
        [form, editingId, handleAddVolunteer, handleUpdateVolunteer, t]
    )

    function startEdit(vol) {
        setEditingId(vol.volunteer_id)
        setForm({
            full_name: vol.full_name,
            phone: vol.phone,
            vehicle_type: vol.vehicle_type || '',
        })
    }

    function cancelEdit() {
        setEditingId(null)
        setForm(INITIAL_FORM)
    }

    const handleDelete = useCallback(
        async (volunteerId, e) => {
            animateButtonPress(e.currentTarget)
            if (!window.confirm(t('ngo.removeVolunteer'))) return
            try {
                await handleRemoveVolunteer(volunteerId)
            } catch {
                /* handled in context */
            }
        },
        [handleRemoveVolunteer, t]
    )

    const handleToggleAvailability = useCallback(
        async (vol, e) => {
            animateButtonPress(e.currentTarget)
            try {
                await handleUpdateVolunteer(vol.volunteer_id, {
                    availability_status: !vol.availability_status,
                })
            } catch {
                /* handled in context */
            }
        },
        [handleUpdateVolunteer]
    )

    return (
        <div className="ngo-volunteer-module">
            {/* Add / Edit Form */}
            <form className="ngo-vol-form ngo-scroll-form" onSubmit={handleSubmit}>
                <h4 className="ngo-form-title">{editingId ? t('ngo.editVolunteer') : t('ngo.addVolunteer')}</h4>
                <div className="ngo-form-grid">
                    <div className="ngo-form-group">
                        <label htmlFor="vol-name">{t('ngo.fullNameRequired')}</label>
                        <input
                            id="vol-name"
                            name="full_name"
                            type="text"
                            className="ngo-input"
                            value={form.full_name}
                            onChange={handleFormChange}
                            placeholder={t('ngo.volunteerName')}
                            required
                        />
                    </div>
                    <div className="ngo-form-group">
                        <label htmlFor="vol-phone">{t('ngo.phoneRequired')}</label>
                        <input
                            id="vol-phone"
                            name="phone"
                            type="tel"
                            className="ngo-input"
                            value={form.phone}
                            onChange={handleFormChange}
                            placeholder={t('ngo.phonePlaceholder')}
                            required
                        />
                    </div>
                    <div className="ngo-form-group">
                        <label htmlFor="vol-vehicle">{t('ngo.vehicleType')}</label>
                        <select
                            id="vol-vehicle"
                            name="vehicle_type"
                            className="ngo-select"
                            value={form.vehicle_type}
                            onChange={handleFormChange}
                        >
                            <option value="">{t('ngo.none')}</option>
                            {VEHICLE_TYPES.map((v) => (
                                <option key={v} value={v}>
                                    {t(`ngo.${v}`, { defaultValue: v.charAt(0).toUpperCase() + v.slice(1) })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {formError && <p className="ngo-form-error">{formError}</p>}
                <div className="ngo-form-actions">
                    <button
                        type="submit"
                        className="ngo-btn ngo-btn--primary"
                        disabled={loading.action}
                    >
                        {editingId ? t('ngo.updateVolunteer') : t('ngo.addVolunteer')}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            className="ngo-btn ngo-btn--ghost"
                            onClick={cancelEdit}
                        >
                            {t('cancel', { ns: 'common' })}
                        </button>
                    )}
                </div>
            </form>

            {/* Volunteer Table */}
            {loading.volunteers && volunteers.length === 0 ? (
                <div className="ngo-table-wrap">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="ngo-skeleton-row"><div className="ngo-skeleton-line" /></div>
                    ))}
                </div>
            ) : errors.volunteers ? (
                <div className="ngo-error-state">
                    <span className="ngo-error-state__icon">⚠</span>
                    <p>{errors.volunteers}</p>
                    <button className="ngo-btn ngo-btn--outline" onClick={fetchVolunteers}>{t('retry', { ns: 'common' })}</button>
                </div>
            ) : volunteers.length === 0 ? (
                <div className="ngo-empty-state">
                    <span className="ngo-empty-state__icon">◉</span>
                    <h4>{t('ngo.noVolunteersYet')}</h4>
                    <p>{t('ngo.addFirstVolunteer')}</p>
                </div>
            ) : (
                <div className="ngo-table-wrap ngo-scroll-table">
                    <table className="ngo-table">
                        <thead>
                            <tr>
                                <th>{t('name')}</th>
                                <th>{t('phone')}</th>
                                <th>{t('ngo.vehicleType')}</th>
                                <th>{t('ngo.availability')}</th>
                                <th>{t('ngo.currentAssignment')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {volunteers.map((vol) => {
                                const assignment = getCurrentAssignment(vol.volunteer_id)
                                return (
                                    <tr key={vol.volunteer_id} className="ngo-vol-row">
                                        <td className="ngo-cell-main">{vol.full_name}</td>
                                        <td>{vol.phone}</td>
                                        <td>
                                            {vol.vehicle_type
                                                ? t(`ngo.${vol.vehicle_type}`, { defaultValue: vol.vehicle_type.charAt(0).toUpperCase() + vol.vehicle_type.slice(1) })
                                                : '—'}
                                        </td>
                                        <td>
                                            <button
                                                className={`ngo-avail-toggle ${vol.availability_status ? 'ngo-avail-toggle--on' : ''
                                                    }`}
                                                onClick={(e) => handleToggleAvailability(vol, e)}
                                                disabled={loading.action}
                                            >
                                                {vol.availability_status ? t('available', { ns: 'common' }) : t('unavailable', { ns: 'common' })}
                                            </button>
                                        </td>
                                        <td>
                                            {assignment ? (
                                                <span className="ngo-badge ngo-badge--info">{assignment}</span>
                                            ) : (
                                                <span className="ngo-cell-sub">{t('ngo.unassigned')}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="ngo-action-btns">
                                                <button
                                                    className="ngo-btn ngo-btn--sm ngo-btn--outline"
                                                    onClick={() => startEdit(vol)}
                                                >
                                                    {t('edit', { ns: 'common' })}
                                                </button>
                                                <button
                                                    className="ngo-btn ngo-btn--sm ngo-btn--ghost"
                                                    onClick={(e) => handleDelete(vol.volunteer_id, e)}
                                                    disabled={loading.action}
                                                >
                                                    {t('remove', { ns: 'common' })}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
