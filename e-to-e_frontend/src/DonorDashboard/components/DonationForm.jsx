import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { playSuccessAnimation } from '../animations/dashboardAnimations'
import { createListing } from '../../lib/donorApi'
import { useSocket } from '../../context/SocketContext'
import LocationPicker from '../../components/auth/LocationPicker'

const FOOD_TYPES = [
    'Cooked Meals',
    'Raw Vegetables',
    'Bakery Items',
    'Dairy Products',
    'Fruits',
    'Beverages',
    'Other',
]

export default function DonationForm({ onSuccess }) {
    const { t } = useTranslation('dashboard')
    const socket = useSocket()
    const [form, setForm] = useState({
        food_type: '',
        quantity_kg: '',
        meal_equivalent: '',
        expiry_time: '',
        pickup_address: '',
        latitude: null,
        longitude: null,
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [notification, setNotification] = useState(null)
    const submitBtnRef = useRef(null)

    /* ── Socket Listeners for acceptance/rejection ── */
    useEffect(() => {
        if (!socket) return

        const handleAccepted = (data) => {
            setNotification({ type: 'success', message: data.message })
            setTimeout(() => setNotification(null), 6000)
        }

        const handleRejected = (data) => {
            setNotification({ type: 'error', message: data.message })
            setTimeout(() => setNotification(null), 6000)
        }

        socket.on('donation_accepted', handleAccepted)
        socket.on('donation_rejected', handleRejected)

        return () => {
            socket.off('donation_accepted', handleAccepted)
            socket.off('donation_rejected', handleRejected)
        }
    }, [socket])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleCoordsChange = useCallback((lat, lng) => {
        setForm((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
        }))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        // Validation
        if (
            !form.food_type ||
            !form.quantity_kg ||
            !form.meal_equivalent ||
            !form.expiry_time ||
            !form.pickup_address ||
            !form.latitude ||
            !form.longitude
        ) {
            setError(t('fillAllFieldsError'))
            return
        }

        // Validate expiry_time is in the future
        const parsedExpiry = new Date(form.expiry_time)
        if (isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
            setError(t('expiryTimeFutureError'))
            return
        }

        setSubmitting(true)
        try {
            await createListing({
                food_type: form.food_type,
                quantity_kg: parseFloat(form.quantity_kg),
                meal_equivalent: parseInt(form.meal_equivalent, 10),
                expiry_time: parsedExpiry.toISOString(),
                pickup_address: form.pickup_address,
                latitude: form.latitude,
                longitude: form.longitude
            })

            playSuccessAnimation(submitBtnRef.current)
            setSuccess(true)

            // Reset form
            setForm({
                food_type: '',
                quantity_kg: '',
                meal_equivalent: '',
                expiry_time: '',
                pickup_address: '',
                latitude: null,
                longitude: null,
            })

            if (onSuccess) onSuccess()

            setTimeout(() => setSuccess(false), 4000)
        } catch (err) {
            const rawMsg = err?.message || err?.error || ''
            let userMsg = 'Something went wrong while creating your donation. Please try again.'

            if (rawMsg.includes('stack depth') || rawMsg.includes('recursion')) {
                userMsg = 'We are experiencing a temporary server issue. Please try again in a moment.'
            } else if (rawMsg.includes('Donor profile not found')) {
                userMsg = 'Your donor profile was not found. Please log out and register again.'
            } else if (rawMsg.includes('Missing required fields')) {
                userMsg = 'Please fill in all required fields before submitting.'
            } else if (rawMsg.includes('Failed to create listing')) {
                userMsg = 'Could not create your donation listing. Please check your details and try again.'
            } else if (rawMsg.includes('network') || rawMsg.includes('fetch')) {
                userMsg = 'Unable to reach the server. Please check your internet connection.'
            } else if (rawMsg && rawMsg.length < 100) {
                userMsg = rawMsg
            }

            setError(userMsg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="dd-step-container">
            <div className="dd-step-header">
                <h2 className="dd-step-title">{t('donationDetails')}</h2>
            </div>

            {/* Real-time WhatsApp-like Notification */}
            {notification && (
                <div className={`dd-live-notification ${notification.type}`}>
                    <div className="dd-live-notification-icon">
                        {notification.type === 'success' ? '🚀' : '⚠️'}
                    </div>
                    <div className="dd-live-notification-content">
                        <strong>{t('updateFromNGO')}</strong>
                        <p>{notification.message}</p>
                    </div>
                </div>
            )}

            <form className="dd-donation-form" onSubmit={handleSubmit} id="donation-form">
                <div className="dd-form-grid">
                    {/* Food Type */}
                    <div className="dd-form-group">
                        <label htmlFor="food_type" className="dd-form-label">
                            {t('foodTypeLabel')}
                        </label>
                        <select
                            id="food_type"
                            name="food_type"
                            className="dd-form-select"
                            value={form.food_type === 'Other' || FOOD_TYPES.includes(form.food_type) ? form.food_type : 'Other'}
                            onChange={(e) => {
                                if (e.target.value === 'Other') {
                                    setForm((prev) => ({ ...prev, food_type: '' }))
                                } else {
                                    handleChange(e)
                                }
                            }}
                        >
                            <option value="">{t('selectFoodType')}</option>
                            {FOOD_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>

                        {/* Show text input if 'Other' is selected or custom value entered */}
                        {(form.food_type === '' || (form.food_type && !FOOD_TYPES.includes(form.food_type))) && (
                            <input
                                type="text"
                                name="food_type"
                                className="dd-form-input"
                                placeholder={t('enterCustomFoodType')}
                                value={form.food_type}
                                onChange={handleChange}
                                style={{ marginTop: '0.5rem' }}
                            />
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="dd-form-group">
                        <label htmlFor="quantity_kg" className="dd-form-label">
                            {t('quantityLabel')}
                        </label>
                        <input
                            id="quantity_kg"
                            name="quantity_kg"
                            type="number"
                            min="0.5"
                            step="0.5"
                            className="dd-form-input"
                            placeholder={t('quantityPlaceholder')}
                            value={form.quantity_kg}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Meal Equivalent */}
                    <div className="dd-form-group">
                        <label htmlFor="meal_equivalent" className="dd-form-label">
                            {t('mealEquivalentLabel')}
                        </label>
                        <input
                            id="meal_equivalent"
                            name="meal_equivalent"
                            type="number"
                            min="1"
                            className="dd-form-input"
                            placeholder={t('mealEquivalentPlaceholder')}
                            value={form.meal_equivalent}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Expiry Time */}
                    <div className="dd-form-group">
                        <label htmlFor="expiry_time" className="dd-form-label">
                            {t('expiryTimeLabel')}
                        </label>
                        <input
                            id="expiry_time"
                            name="expiry_time"
                            type="datetime-local"
                            className="dd-form-input"
                            value={form.expiry_time}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Map Picker */}
                    <div className="dd-form-divider" />

                    <div className="dd-form-group dd-form-group--full">
                        <label className="dd-form-label">
                            {t('pickupLocationLabel')}
                        </label>
                        <LocationPicker
                            address={form.pickup_address}
                            onAddressChange={(address) =>
                                setForm((prev) => ({ ...prev, pickup_address: address }))
                            }
                            onCityChange={() => { }}
                            onCoordsChange={handleCoordsChange}
                        />
                    </div>
                </div>

                {/* Feedback */}
                {error && <div className="dd-form-error">{error}</div>}
                {success && (
                    <div className="dd-form-success">
                        {t('donationCreatedSuccess')}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn--primary dd-form-submit"
                    disabled={submitting}
                    ref={submitBtnRef}
                >
                    {submitting ? t('creatingDonation') : t('createDonation')}
                </button>
            </form>
        </div>
    )
}
