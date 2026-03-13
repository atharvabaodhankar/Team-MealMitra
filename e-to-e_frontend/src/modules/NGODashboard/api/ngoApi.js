/**
 * NGO Dashboard — API Client
 * Maps every backend endpoint exactly.
 * Field names match the database schema (01_schema.sql).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('access_token')

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    }

    if (options.body instanceof FormData) {
        delete headers['Content-Type']
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })

    const data = await response.json()

    if (!response.ok) {
        throw { status: response.status, ...data }
    }

    return data
}

/* ─── Auth ─── */
export const getCurrentUser = () => apiFetch('/auth/me')

/* ─── NGO Profile ─── */
export const getNGOProfile = () => apiFetch('/ngos/me')

export const updateNGOProfile = (updates) =>
    apiFetch('/ngos/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
    })

export const getNGOImpact = () => apiFetch('/ngos/me/impact')

/* ─── Food Listings (Incoming Donations) ─── */
export const getAvailableListings = () => apiFetch('/listings')

export const getListingById = (listingId) => apiFetch(`/listings/${listingId}`)

export const searchListings = (query) => apiFetch(`/listings/search?q=${encodeURIComponent(query)}`)

/* ─── Claims ─── */
export const claimListing = ({ listing_id, pickup_scheduled_time, strategy_notes }) =>
    apiFetch('/claims', {
        method: 'POST',
        body: JSON.stringify({ listing_id, pickup_scheduled_time, strategy_notes }),
    })

export const getMyClaims = (status) =>
    apiFetch(`/claims/my${status ? `?status=${status}` : ''}`)

export const getClaimById = (claimId) => apiFetch(`/claims/${claimId}`)

export const updateClaim = (claimId, updates) =>
    apiFetch(`/claims/${claimId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    })

export const cancelClaim = (claimId) =>
    apiFetch(`/claims/${claimId}`, {
        method: 'DELETE',
    })

/* ─── Volunteers ─── */
// DB schema: volunteer_id, ngo_id, full_name, phone, availability_status, vehicle_type
export const getVolunteers = () => apiFetch('/ngos/me/volunteers')

export const addVolunteer = ({ full_name, phone, vehicle_type }) =>
    apiFetch('/ngos/me/volunteers', {
        method: 'POST',
        body: JSON.stringify({ full_name, phone, vehicle_type }),
    })

export const updateVolunteer = (volunteerId, updates) =>
    apiFetch(`/ngos/me/volunteers/${volunteerId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    })

export const removeVolunteer = (volunteerId) =>
    apiFetch(`/ngos/me/volunteers/${volunteerId}`, {
        method: 'DELETE',
    })

/* ─── Deliveries ─── */
export const assignDelivery = ({ claim_id, volunteer_id }) =>
    apiFetch('/deliveries', {
        method: 'POST',
        body: JSON.stringify({ claim_id, volunteer_id }),
    })

export const getMyDeliveries = (status) =>
    apiFetch(`/deliveries/my${status ? `?status=${status}` : ''}`)

export const getDeliveryById = (deliveryId) =>
    apiFetch(`/deliveries/${deliveryId}`)

export const updateDeliveryStatus = (deliveryId, { status, pickup_time, delivery_time, proof_image_url }) =>
    apiFetch(`/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, pickup_time, delivery_time, proof_image_url }),
    })

export const reassignVolunteer = (deliveryId, volunteer_id) =>
    apiFetch(`/deliveries/${deliveryId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ volunteer_id }),
    })

/* ─── Impact & Dashboard ─── */
export const getTotalImpact = () => apiFetch('/impact/total')

export const getDashboardSummary = () => apiFetch('/impact/dashboard')

export const getNGOPerformance = () => apiFetch('/impact/performance/ngos')

export const getImpactSummary = () => apiFetch('/impact/summary')
