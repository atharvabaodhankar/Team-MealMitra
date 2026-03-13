import { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNGO } from '../context/NGOContext'
import 'leaflet/dist/leaflet.css'

/* ─── Custom Marker Icons ─── */
function createIcon(color, label) {
    return L.divIcon({
        className: 'ngo-map-marker',
        html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;font-weight:700;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            border:2px solid #fff;
        ">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    })
}

const NGO_ICON = createIcon('#443c3c', 'N')
const DONOR_ICON = createIcon('#2ecc71', 'D') // Green for active donations

/* ─── Auto-fit bounds ─── */
function FitBounds({ positions }) {
    const map = useMap()
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions)
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
        }
    }, [positions, map])
    return null
}

export default function MapPanel() {
    const { ngoProfile, claims, listings, claimListing } = useNGO()
    const mapRef = useRef(null)
    const [actionLoading, setActionLoading] = useState(null)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

    /* Fixed map center */
    const ngoLat = 17.674553
    const ngoLng = 75.323726

    /* Active Donation Markers (Open listings) */
    const activeMarkers = useMemo(() => {
        const markers = []
        const seen = new Set()

        listings.forEach((l) => {
            const lat = parseFloat(l.latitude)
            const lng = parseFloat(l.longitude)
            if (!lat || !lng) return
            const key = `${lat}-${lng}`
            if (seen.has(key)) return
            seen.add(key)
            markers.push({
                id: l.listing_id,
                lat,
                lng,
                name: l.donor_name || 'Donor',
                food: l.food_type || '',
                qty: l.quantity_kg || '',
                address: l.pickup_address || '',
                type: 'listing',
            })
        })

        return markers
    }, [listings])

    /* Accepted Donation Markers (Claims) */
    const acceptedMarkers = useMemo(() => {
        const markers = []
        const seen = new Set()

        claims.forEach((claim) => {
            const fl = claim.food_listings
            if (!fl || !fl.latitude || !fl.longitude) return
            const key = `${fl.latitude}-${fl.longitude}`
            if (seen.has(key)) return
            seen.add(key)
            markers.push({
                id: fl.listing_id || claim.claim_id,
                lat: parseFloat(fl.latitude),
                lng: parseFloat(fl.longitude),
                name: fl.donors?.organization_name || fl.donors?.city || 'Donor',
                food: fl.food_type || '',
                qty: fl.quantity_kg || '',
                address: fl.pickup_address || '',
                type: 'claim',
            })
        })

        return markers
    }, [claims])

    const handleAccept = async (id) => {
        setActionLoading(id)
        try {
            await claimListing(id)
        } catch (err) {
            console.error('Accept error:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (id) => {
        setActionLoading(id)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`${API_URL}/listings/${id}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error('Failed to reject')

            // Re-fetch listings to update UI
            window.location.reload() // Simple way for now, or update state if possible
        } catch (err) {
            console.error('Reject error:', err)
        } finally {
            setActionLoading(null)
        }
    }

    /* All positions for bounds fitting */
    const allPositions = useMemo(() => {
        const pts = [[ngoLat, ngoLng]]
        activeMarkers.forEach((m) => pts.push([m.lat, m.lng]))
        acceptedMarkers.forEach((m) => pts.push([m.lat, m.lng]))
        return pts
    }, [ngoLat, ngoLng, activeMarkers, acceptedMarkers])

    return (
        <div className="ngo-map-container ngo-scroll-map">
            <MapContainer
                ref={mapRef}
                center={[ngoLat, ngoLng]}
                zoom={12}
                style={{ width: '100%', height: '100%', borderRadius: '12px' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />

                <FitBounds positions={allPositions} />

                {/* NGO marker */}
                <Marker position={[ngoLat, ngoLng]} icon={NGO_ICON}>
                    <Popup>
                        <strong>{ngoProfile?.ngo_name || 'Your NGO'}</strong>
                        <br />
                        {ngoProfile?.address || ''}
                    </Popup>
                </Marker>

                {/* Active Donation markers */}
                {activeMarkers.map((m) => (
                    <Marker key={m.id} position={[m.lat, m.lng]} icon={DONOR_ICON}>
                        <Popup>
                            <div className="ngo-map-popup">
                                <strong>{m.name}</strong>
                                <p>{m.food} — {m.qty} kg</p>
                                <small>{m.address}</small>
                                <div className="ngo-map-actions">
                                    <button
                                        className="ngo-btn ngo-btn--primary ngo-btn--sm"
                                        onClick={() => handleAccept(m.id)}
                                        disabled={actionLoading === m.id}
                                    >
                                        {actionLoading === m.id ? 'Accepting...' : 'Accept'}
                                    </button>
                                    <button
                                        className="ngo-btn ngo-btn--outline ngo-btn--sm"
                                        onClick={() => handleReject(m.id)}
                                        disabled={actionLoading === m.id}
                                        style={{ marginLeft: '8px' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Accepted Donation markers */}
                {acceptedMarkers.map((m) => (
                    <Marker key={m.id} position={[m.lat, m.lng]} icon={createIcon('#3498db', 'D')}>
                        <Popup>
                            <strong>{m.name} (Accepted)</strong>
                            <br />
                            {m.food} — {m.qty} kg
                            <br />
                            <small>{m.address}</small>
                        </Popup>
                    </Marker>
                ))}

                {/* Route lines for accepted claims */}
                {acceptedMarkers.map((m) => (
                    <Polyline
                        key={m.id}
                        positions={[[ngoLat, ngoLng], [m.lat, m.lng]]}
                        pathOptions={{
                            color: '#3498db',
                            weight: 2,
                            opacity: 0.6,
                            dashArray: '8, 8',
                        }}
                    />
                ))}
            </MapContainer>

            {/* Map legend */}
            <div className="ngo-map-legend">
                <div className="ngo-map-legend__item">
                    <span className="ngo-map-legend__dot" style={{ background: '#443c3c' }} />
                    <span>NGO</span>
                </div>
                <div className="ngo-map-legend__item">
                    <span className="ngo-map-legend__dot" style={{ background: '#2ecc71' }} />
                    <span>New Donations</span>
                </div>
                <div className="ngo-map-legend__item">
                    <span className="ngo-map-legend__dot" style={{ background: '#3498db' }} />
                    <span>Accepted Missions</span>
                </div>
            </div>
        </div>
    )
}
