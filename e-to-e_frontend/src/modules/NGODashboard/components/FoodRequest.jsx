import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNGO } from '../context/NGOContext'
import { Search, UserCircle, MapPin, Clock, Leaf, CheckCircle } from 'lucide-react'

export default function FoodRequest() {
    const { t } = useTranslation('dashboard')
    const { searchFoodInventory, searchResults, loading, handleClaimListing, claims } = useNGO()

    const [query, setQuery] = useState('')
    const [hasSearched, setHasSearched] = useState(false)

    // Check if listing is already claimed by us
    const isClaimedByUs = useCallback((listingId) => {
        return claims.some(c => c.listing_id === listingId && ['claimed', 'scheduled', 'picked'].includes(c.status))
    }, [claims])

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!query.trim()) return

        setHasSearched(true)
        try {
            await searchFoodInventory(query)
        } catch (err) {
            console.error(err)
        }
    }

    const handleRequest = useCallback(
        async (listing, e) => {
            if (isClaimedByUs(listing.listing_id)) return
            const btn = e.currentTarget
            btn.classList.add('ngo-btn--loading')
            try {
                await handleClaimListing(listing.listing_id)
                await searchFoodInventory(query) // Refresh listings
            } catch {
                /* handled in context */
            } finally {
                btn.classList.remove('ngo-btn--loading')
            }
        },
        [handleClaimListing, searchFoodInventory, query, isClaimedByUs]
    )

    function getDonorName(listing) {
        if (listing.donors?.profiles?.organization_name) return listing.donors.profiles.organization_name
        if (listing.donors?.profiles?.full_name) return listing.donors.profiles.full_name
        if (listing.organization_name) return listing.organization_name
        if (listing.donors?.organization_name) return listing.donors.organization_name
        if (listing.donor_name) return listing.donor_name
        if (listing.donors?.city) return `${t('ngo.donor')} (${listing.donors.city})`
        return t('ngo.unknownDonor')
    }

    function getLocation(listing) {
        if (listing.donors?.address) return listing.donors.address
        if (listing.donors?.city) return listing.donors.city
        if (listing.pickup_address) return listing.pickup_address
        return '—'
    }

    function getTimeRemaining(expiryTime) {
        if (!expiryTime) return '—'
        const diff = new Date(expiryTime) - new Date()
        if (diff <= 0) return t('ngo.expired')
        const hours = Math.floor(diff / 3600000)
        const mins = Math.floor((diff % 3600000) / 60000)
        if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
        return `${hours}h ${mins}m`
    }

    function calculateCarbonPoints(quantity) {
        if (!quantity) return 0
        // Approx 2.5 kg CO2e per 1 kg of food saved
        return (parseFloat(quantity) * 2.5).toFixed(1)
    }

    // Filter out logically expired (backend should handle, but fallback)
    const validListings = searchResults?.filter(listing => {
        const diff = new Date(listing.expiry_time) - new Date()
        return diff > 0
    }) || []

    return (
        <div className="ngo-overview-panel">
            <div className="ngo-panel-header" style={{ marginBottom: '20px' }}>
                <span className="ngo-panel-label">{t('TARGETED FOOD REQUEST', 'TARGETED FOOD REQUEST')}</span>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={20} />
                    <input
                        type="text"
                        placeholder={t('Search specific food items (e.g., Rice, Bread)...', 'Search specific food items (e.g., Rice, Bread)...')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="ngo-input"
                        style={{ width: '100%', paddingLeft: '48px', height: '48px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                </div>
                <button
                    type="submit"
                    className="ngo-btn ngo-btn--primary"
                    disabled={loading.search || !query.trim()}
                    style={{ height: '48px', padding: '0 24px', fontSize: '16px' }}
                >
                    {loading.search ? t('Searching...', 'Searching...') : t('Search', 'Search')}
                </button>
            </form>

            <div className="ngo-table-wrap ngo-scroll-table">
                {loading.search ? (
                    <div>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="ngo-skeleton-row">
                                <div className="ngo-skeleton-line" />
                            </div>
                        ))}
                    </div>
                ) : validListings.length > 0 ? (
                    <table className="ngo-table">
                        <thead>
                            <tr>
                                <th>{t('ngo.donor', 'Donor')}</th>
                                <th>{t('foodType', 'Food Type')}</th>
                                <th>{t('quantity', 'Quantity')}</th>
                                <th>{t('Location', 'Location')}</th>
                                <th>{t('Carbon', 'Carbon Value')}</th>
                                <th>{t('ngo.expiry', 'Expiry')}</th>
                                <th>{t('actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validListings.map((listing) => {
                                const claimed = isClaimedByUs(listing.listing_id)
                                return (
                                    <tr key={listing.listing_id} className="ngo-incoming-row">
                                        <td>
                                            <div className="ngo-cell-main" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <UserCircle size={16} color="#666" />
                                                {getDonorName(listing)}
                                            </div>
                                        </td>
                                        <td>{listing.food_type || '—'}</td>
                                        <td>{listing.quantity_kg ? `${listing.quantity_kg} kg` : '—'}</td>
                                        <td>
                                            <div className="ngo-cell-address" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={14} color="#888" />
                                                {getLocation(listing)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--swiss-coffee)' }}>
                                                <Leaf size={14} />
                                                {calculateCarbonPoints(listing.quantity_kg)} kg CO₂e
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`ngo-expiry-badge ${getTimeRemaining(listing.expiry_time) === t('ngo.expired') ? 'ngo-expiry-badge--expired' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} />
                                                {getTimeRemaining(listing.expiry_time)}
                                            </span>
                                        </td>
                                        <td>
                                            {claimed ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--swiss-coffee)', fontWeight: 'bold' }}>
                                                    <CheckCircle size={18} />
                                                    {t('ngo.accepted', 'Accepted')}
                                                </div>
                                            ) : (
                                                <button
                                                    className="ngo-btn ngo-btn--accept"
                                                    onClick={(e) => handleRequest(listing, e)}
                                                    disabled={loading.action}
                                                >
                                                    {loading.action ? t('ngo.accepting', 'Requesting...') : t('Select / Request', 'Select / Request')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : hasSearched && !loading.search ? (
                    <div className="ngo-empty-state">
                        <Search size={40} color="#ccc" style={{ marginBottom: '16px' }} />
                        <h4>{t('No active donors found', 'No active donors found')}</h4>
                        <p>{t('Try searching for a different food item. Active donors matching your criteria will appear here.', 'Try searching for a different food item. Active donors matching your criteria will appear here.')}</p>
                    </div>
                ) : (
                    <div className="ngo-empty-state" style={{ opacity: 0.7 }}>
                        <Search size={40} color="#ccc" style={{ marginBottom: '16px' }} />
                        <h4>{t('Search Food Inventory', 'Search Food Inventory')}</h4>
                        <p>{t('Use the search bar above to find specific food items available from nearby donors.', 'Use the search bar above to find specific food items available from nearby donors.')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
