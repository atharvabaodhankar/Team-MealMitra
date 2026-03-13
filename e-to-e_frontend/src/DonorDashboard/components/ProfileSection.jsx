import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from 'gsap'

export default function ProfileSection({ user, donorProfile, impact, onSave }) {
    const { t } = useTranslation('dashboard')
    const panelRef = useRef(null)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        organization_name: '',
        business_type: '',
        address: '',
        city: '',
        latitude: '',
        longitude: '',
        csr_participant: false,
    })

    const email = user?.email || ''
    const avatarLetter = email ? email.charAt(0).toUpperCase() : 'D'
    const displayName = user?.full_name || donorProfile?.profiles?.full_name || 'Donor'
    const role = user?.role || 'donor'

    useEffect(() => {
        if (!panelRef.current) return
        gsap.fromTo(
            panelRef.current.children,
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.08,
                ease: 'expo.out',
            }
        )
    }, [])

    useEffect(() => {
        setForm({
            full_name: user?.full_name || donorProfile?.profiles?.full_name || '',
            phone: user?.phone || donorProfile?.profiles?.phone || '',
            organization_name: user?.organization_name || donorProfile?.profiles?.organization_name || '',
            business_type: donorProfile?.business_type || '',
            address: donorProfile?.address || '',
            city: donorProfile?.city || '',
            latitude: donorProfile?.latitude != null ? String(donorProfile.latitude) : '',
            longitude: donorProfile?.longitude != null ? String(donorProfile.longitude) : '',
            csr_participant: Boolean(donorProfile?.csr_participant),
        })
    }, [user, donorProfile])

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setSaveError('')
        setSaving(true)
        try {
            const payload = {
                full_name: form.full_name || null,
                phone: form.phone || null,
                organization_name: form.organization_name || null,
                business_type: form.business_type || null,
                address: form.address || null,
                city: form.city || null,
                csr_participant: Boolean(form.csr_participant),
            }

            if (form.latitude !== '') payload.latitude = Number(form.latitude)
            if (form.longitude !== '') payload.longitude = Number(form.longitude)

            if (Number.isNaN(payload.latitude)) delete payload.latitude
            if (Number.isNaN(payload.longitude)) delete payload.longitude

            await onSave(payload)
            setIsEditing(false)
        } catch (err) {
            setSaveError(err?.message || err?.error || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const details = [
        { label: t('fullName'), value: displayName },
        { label: t('emailAddress'), value: email || '-' },
        { label: t('phone'), value: user?.phone || donorProfile?.profiles?.phone || '-' },
        { label: t('role'), value: role.charAt(0).toUpperCase() + role.slice(1) },
        { label: t('organization'), value: user?.organization_name || donorProfile?.profiles?.organization_name || '-' },
        { label: t('address'), value: donorProfile?.address || '-' },
        { label: t('csrParticipant'), value: donorProfile?.csr_participant ? t('yes') : t('no') },
        {
            label: t('memberSince'),
            value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })
                : '-',
        },
    ]

    const impactStats = [
        { label: t('totalDonationsCount'), value: impact?.listing_count ?? '-' },
        { label: t('mealsShared'), value: impact?.total_meals ?? '-' },
        { label: t('co2Reduced'), value: impact?.total_co2_kg ? `${impact.total_co2_kg.toFixed(1)} kg` : '-' },
        { label: t('foodSaved'), value: impact?.total_food_kg ? `${impact.total_food_kg} kg` : '-' },
    ]

    return (
        <div className="dd-profile-view" ref={panelRef}>
            <div className="dd-profile-identity">
                <div className="dd-profile-identity__left">
                    <div className="dd-profile-identity__avatar">
                        {avatarLetter}
                    </div>
                    <div className="dd-profile-identity__illustration">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.08">
                            <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="1" />
                            <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="60" cy="60" r="26" stroke="currentColor" strokeWidth="0.3" />
                            <circle cx="60" cy="45" r="14" stroke="currentColor" strokeWidth="0.8" />
                            <path d="M30 95c0-17 13-30 30-30s30 13 30 30" stroke="currentColor" strokeWidth="0.8" />
                        </svg>
                    </div>
                </div>
                <div className="dd-profile-identity__right">
                    <span className="dd-profile-identity__label">{t('identity')}</span>
                    <h2 className="dd-profile-identity__name">{displayName}</h2>
                    <span className="dd-profile-identity__role-badge">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                    <p className="dd-profile-identity__email">{email}</p>
                </div>
            </div>

            <div className="dd-profile-details-card">
                <div className="dd-profile-details-card__header">
                    <span className="dd-profile-details-card__label">{t('personalInformation')}</span>
                    {!isEditing ? (
                        <button type="button" className="dd-profile-edit-btn" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </button>
                    ) : (
                        <div className="dd-profile-edit-actions">
                            <button
                                type="button"
                                className="dd-profile-edit-btn dd-profile-edit-btn--secondary"
                                onClick={() => {
                                    setIsEditing(false)
                                    setSaveError('')
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="dd-profile-edit-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                {!isEditing ? (
                    <div className="dd-profile-details-grid">
                        {details.map((d) => (
                            <div key={d.label} className="dd-profile-detail-item">
                                <span className="dd-profile-detail-item__label">{d.label}</span>
                                <span className="dd-profile-detail-item__value">{d.value}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="dd-profile-form-grid">
                        <label className="dd-profile-form-field">
                            <span>Full Name</span>
                            <input value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-field">
                            <span>Phone</span>
                            <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-field">
                            <span>Organization</span>
                            <input value={form.organization_name} onChange={(e) => handleChange('organization_name', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-field">
                            <span>Business Type</span>
                            <input value={form.business_type} onChange={(e) => handleChange('business_type', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-field">
                            <span>Address</span>
                            <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-field">
                            <span>City</span>
                            <input value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-field">
                            <span>Latitude</span>
                            <input value={form.latitude} onChange={(e) => handleChange('latitude', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-field">
                            <span>Longitude</span>
                            <input value={form.longitude} onChange={(e) => handleChange('longitude', e.target.value)} />
                        </label>
                        <label className="dd-profile-form-checkbox">
                            <input
                                type="checkbox"
                                checked={form.csr_participant}
                                onChange={(e) => handleChange('csr_participant', e.target.checked)}
                            />
                            <span>CSR Participant</span>
                        </label>
                        {saveError ? <div className="dd-profile-form-error">{saveError}</div> : null}
                    </div>
                )}
            </div>

            <div className="dd-profile-details-card">
                <span className="dd-profile-details-card__label">{t('impactSummary')}</span>
                <div className="dd-profile-impact-grid">
                    {impactStats.map((s) => (
                        <div key={s.label} className="dd-profile-impact-item">
                            <span className="dd-profile-impact-item__value">{s.value}</span>
                            <span className="dd-profile-impact-item__label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
