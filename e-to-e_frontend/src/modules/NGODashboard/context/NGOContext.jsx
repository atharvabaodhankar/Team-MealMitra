import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import * as api from '../api/ngoApi'

const NGOContext = createContext(null)

export function useNGO() {
    const ctx = useContext(NGOContext)
    if (!ctx) throw new Error('useNGO must be used inside <NGOProvider>')
    return ctx
}

export function NGOProvider({ children }) {
    /* ─── State ─── */
    const [user, setUser] = useState(null)
    const [ngoProfile, setNgoProfile] = useState(null)
    const [listings, setListings] = useState([])
    const [claims, setClaims] = useState([])
    const [volunteers, setVolunteers] = useState([])
    const [deliveries, setDeliveries] = useState([])
    const [impact, setImpact] = useState(null)
    const [impactSummary, setImpactSummary] = useState(null)

    const [notifications, setNotifications] = useState([])
    const [activityLog, setActivityLog] = useState([])
    const [searchResults, setSearchResults] = useState([])

    const [loading, setLoading] = useState({
        initial: true,
        listings: false,
        claims: false,
        volunteers: false,
        deliveries: false,
        action: false,
        search: false,
    })

    const [errors, setErrors] = useState({})

    const channelRef = useRef(null)

    /* ─── Helpers ─── */
    const addNotification = useCallback((type, message, data = {}) => {
        const id = Date.now() + Math.random()
        setNotifications((prev) => [{ id, type, message, data, time: new Date() }, ...prev].slice(0, 50))
        return id
    }, [])

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, [])

    const addLog = useCallback((eventType, details = {}) => {
        setActivityLog((prev) =>
            [
                {
                    id: Date.now() + Math.random(),
                    timestamp: new Date().toISOString(),
                    event_type: eventType,
                    ...details,
                },
                ...prev,
            ].slice(0, 200)
        )
    }, [])

    /* ─── Error Mapping ─── */
    const friendlyError = useCallback((err) => {
        const msg = err?.message || err?.error || 'Unknown error'
        if (msg.includes('stack depth') || msg.includes('recursion'))
            return 'Temporary server issue. Data will refresh shortly.'
        if (msg.includes('not found'))
            return 'Data is unavailable at the moment.'
        if (msg.includes('network') || msg.includes('fetch'))
            return 'Connection issue. Please check your internet.'
        return msg.length < 80 ? msg : 'Something went wrong loading data.'
    }, [])

    /* ─── Data Fetchers ─── */
    const fetchProfile = useCallback(async () => {
        try {
            const data = await api.getNGOProfile()
            setNgoProfile(data.ngo)
            return data.ngo
        } catch (err) {
            setErrors((prev) => ({ ...prev, profile: friendlyError(err) }))
            return null
        }
    }, [])

    const fetchListings = useCallback(async () => {
        if (listings.length === 0) setLoading((l) => ({ ...l, listings: true }))
        try {
            const data = await api.getAvailableListings()
            setListings(data.listings || [])
            setErrors((prev) => ({ ...prev, listings: null }))
        } catch (err) {
            setErrors((prev) => ({ ...prev, listings: friendlyError(err) }))
        } finally {
            setLoading((l) => ({ ...l, listings: false }))
        }
    }, [listings.length])

    const fetchClaims = useCallback(async () => {
        if (claims.length === 0) setLoading((l) => ({ ...l, claims: true }))
        try {
            const data = await api.getMyClaims()
            setClaims(data.claims || [])
            setErrors((prev) => ({ ...prev, claims: null }))
        } catch (err) {
            setErrors((prev) => ({ ...prev, claims: friendlyError(err) }))
        } finally {
            setLoading((l) => ({ ...l, claims: false }))
        }
    }, [claims.length])

    const fetchVolunteers = useCallback(async () => {
        if (volunteers.length === 0) setLoading((l) => ({ ...l, volunteers: true }))
        try {
            const data = await api.getVolunteers()
            setVolunteers(data.volunteers || [])
            setErrors((prev) => ({ ...prev, volunteers: null }))
        } catch (err) {
            setErrors((prev) => ({ ...prev, volunteers: friendlyError(err) }))
        } finally {
            setLoading((l) => ({ ...l, volunteers: false }))
        }
    }, [volunteers.length])

    const fetchDeliveries = useCallback(async () => {
        if (deliveries.length === 0) setLoading((l) => ({ ...l, deliveries: true }))
        try {
            const data = await api.getMyDeliveries()
            setDeliveries(data.deliveries || [])
            setErrors((prev) => ({ ...prev, deliveries: null }))
        } catch (err) {
            setErrors((prev) => ({ ...prev, deliveries: friendlyError(err) }))
        } finally {
            setLoading((l) => ({ ...l, deliveries: false }))
        }
    }, [deliveries.length])

    const fetchImpact = useCallback(async () => {
        try {
            const data = await api.getNGOImpact()
            setImpact(data.impact || null)
        } catch {
            /* impact is non-critical */
        }
        try {
            const summData = await api.getImpactSummary()
            setImpactSummary(summData || null)
        } catch {
            /* non-critical */
        }
    }, [])

    const refreshAll = useCallback(async () => {
        await Promise.all([fetchListings(), fetchClaims(), fetchVolunteers(), fetchDeliveries(), fetchImpact()])
    }, [fetchListings, fetchClaims, fetchVolunteers, fetchDeliveries, fetchImpact])

    /* ─── Actions ─── */
    const searchFoodInventory = useCallback(async (query) => {
        setLoading((l) => ({ ...l, search: true }))
        try {
            if (!query || query.trim() === '') {
                setSearchResults([])
                return []
            }
            const data = await api.searchListings(query)
            setSearchResults(data.listings || [])
            return data.listings || []
        } catch (err) {
            addNotification('error', err.message || 'Failed to search inventory')
            setSearchResults([])
            throw err
        } finally {
            setLoading((l) => ({ ...l, search: false }))
        }
    }, [addNotification])

    const handleClaimListing = useCallback(
        async (listingId, pickupTime, notes) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                const result = await api.claimListing({
                    listing_id: listingId,
                    pickup_scheduled_time: pickupTime || null,
                    strategy_notes: notes || null,
                })
                addNotification('success', 'Donation claimed successfully')
                addLog('claim_created', { listing_id: listingId, claim_id: result.claim?.claim_id })
                await Promise.all([fetchListings(), fetchClaims(), fetchDeliveries(), fetchVolunteers()])
                return result
            } catch (err) {
                addNotification('error', err.message || 'Failed to claim donation')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchListings, fetchClaims]
    )

    const handleAddVolunteer = useCallback(
        async (volunteerData) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                const result = await api.addVolunteer(volunteerData)
                addNotification('success', `Volunteer ${volunteerData.full_name} added`)
                addLog('volunteer_added', { volunteer_name: volunteerData.full_name })
                await fetchVolunteers()
                return result
            } catch (err) {
                addNotification('error', err.message || 'Failed to add volunteer')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchVolunteers]
    )

    const handleUpdateVolunteer = useCallback(
        async (volunteerId, updates) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                await api.updateVolunteer(volunteerId, updates)
                addNotification('success', 'Volunteer updated')
                addLog('volunteer_updated', { volunteer_id: volunteerId })
                await fetchVolunteers()
            } catch (err) {
                addNotification('error', err.message || 'Failed to update volunteer')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchVolunteers]
    )

    const handleRemoveVolunteer = useCallback(
        async (volunteerId) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                await api.removeVolunteer(volunteerId)
                addNotification('success', 'Volunteer removed')
                addLog('volunteer_removed', { volunteer_id: volunteerId })
                await fetchVolunteers()
            } catch (err) {
                addNotification('error', err.message || 'Failed to remove volunteer')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchVolunteers]
    )

    const handleAssignDelivery = useCallback(
        async (claimId, volunteerId) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                const result = await api.assignDelivery({ claim_id: claimId, volunteer_id: volunteerId })
                addNotification('success', 'Volunteer assigned to delivery')
                addLog('delivery_assigned', { claim_id: claimId, volunteer_id: volunteerId })
                await Promise.all([fetchClaims(), fetchDeliveries(), fetchVolunteers()])
                return result
            } catch (err) {
                addNotification('error', err.message || 'Failed to assign delivery')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchClaims, fetchDeliveries, fetchVolunteers]
    )

    const handleReassignDelivery = useCallback(
        async (deliveryId, volunteerId) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                const result = await api.reassignVolunteer(deliveryId, volunteerId)
                addNotification('success', 'Volunteer reassigned successfully')
                addLog('delivery_reassigned', { delivery_id: deliveryId, volunteer_id: volunteerId })
                await Promise.all([fetchClaims(), fetchDeliveries(), fetchVolunteers()])
                return result
            } catch (err) {
                addNotification('error', err.message || 'Failed to reassign volunteer')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchClaims, fetchDeliveries, fetchVolunteers]
    )

    const handleUpdateDeliveryStatus = useCallback(
        async (deliveryId, status, extras = {}) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                await api.updateDeliveryStatus(deliveryId, { status, ...extras })
                addNotification('success', `Delivery status updated to ${status}`)
                addLog('delivery_status_updated', { delivery_id: deliveryId, status })
                await Promise.all([fetchClaims(), fetchDeliveries()])
                // Re-fetch impact data when delivery is completed
                if (status === 'delivered') {
                    fetchImpact()
                }
            } catch (err) {
                addNotification('error', err.message || 'Failed to update delivery')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchClaims, fetchDeliveries, fetchImpact]
    )

    const handleCancelClaim = useCallback(
        async (claimId) => {
            setLoading((l) => ({ ...l, action: true }))
            try {
                await api.cancelClaim(claimId)
                addNotification('success', 'Claim cancelled')
                addLog('claim_cancelled', { claim_id: claimId })
                await Promise.all([fetchListings(), fetchClaims()])
            } catch (err) {
                addNotification('error', err.message || 'Failed to cancel claim')
                throw err
            } finally {
                setLoading((l) => ({ ...l, action: false }))
            }
        },
        [addNotification, addLog, fetchListings, fetchClaims]
    )

    /* ─── Computed Stats ─── */
    const stats = {
        totalDonationsNearby: listings.length,
        acceptedPickups: claims.filter((c) =>
            ['claimed', 'scheduled', 'picked'].includes(c.status)
        ).length,
        availableVolunteers: volunteers.filter((v) => v.availability_status).length,
        completedPickups: deliveries.filter((d) => d.delivery_status === 'delivered').length,
        pendingRequests: listings.length,
    }

    /* ─── Initial Load ─── */
    useEffect(() => {
        let mounted = true

        async function init() {
            try {
                const userData = await api.getCurrentUser()
                if (!mounted) return
                setUser(userData.user)

                const ngo = await fetchProfile()
                if (!mounted || !ngo) return

                await refreshAll()
            } catch (err) {
                if (mounted) {
                    setErrors((prev) => ({ ...prev, init: err.message || 'Initialization failed' }))
                }
            } finally {
                if (mounted) setLoading((l) => ({ ...l, initial: false }))
            }
        }

        init()
        return () => {
            mounted = false
        }
    }, [fetchProfile, refreshAll])

    /* ─── Supabase Realtime Subscriptions ─── */
    useEffect(() => {
        if (!ngoProfile) return

        const channel = supabase
            .channel('ngo-dashboard-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'food_listings' },
                (payload) => {
                    addNotification('new_donation', 'New donation available nearby', payload.new)
                    addLog('new_donation_detected', {
                        listing_id: payload.new?.listing_id,
                        food_type: payload.new?.food_type,
                    })
                    fetchListings()
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'ngo_claims' },
                (payload) => {
                    if (payload.new?.ngo_id === ngoProfile.ngo_id) {
                        addLog('claim_status_changed', {
                            claim_id: payload.new?.claim_id,
                            status: payload.new?.status,
                        })
                        fetchClaims()
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'deliveries' },
                () => {
                    fetchDeliveries()
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [ngoProfile, addNotification, addLog, fetchListings, fetchClaims, fetchDeliveries])

    /* ─── Periodic Refresh (fallback) ─── */
    useEffect(() => {
        if (loading.initial) return
        const interval = setInterval(refreshAll, 60000)
        return () => clearInterval(interval)
    }, [loading.initial, refreshAll])

    /* ─── Context Value ─── */
    const value = {
        user,
        ngoProfile,
        listings,
        claims,
        volunteers,
        deliveries,
        impact,
        impactSummary,
        stats,
        notifications,
        activityLog,
        searchResults,
        loading,
        errors,

        // Fetchers
        refreshAll,
        fetchListings,
        fetchClaims,
        fetchVolunteers,
        fetchDeliveries,

        // Actions
        searchFoodInventory,
        handleClaimListing,
        handleAddVolunteer,
        handleUpdateVolunteer,
        handleRemoveVolunteer,
        handleAssignDelivery,
        handleReassignDelivery,
        handleUpdateDeliveryStatus,
        handleCancelClaim,

        // Notifications
        addNotification,
        removeNotification,
    }

    return <NGOContext.Provider value={value}>{children}</NGOContext.Provider>
}
