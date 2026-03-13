import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { gsap } from 'gsap'
import 'leaflet/dist/leaflet.css'

/* ── Custom marker icons using colored circles ── */
const createIcon = (color, label = '') => {
    const size = label ? 26 : 14
    return L.divIcon({
        className: '',
        html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 2.5px solid rgba(255,255,255,0.9);
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-family: sans-serif;
      font-size: 11px;
      line-height: 1;
    ">${label}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

// Vivid, clearly distinct colours
const ngoIcon    = createIcon('#3498db', 'N')   // Blue   — NGO
const donorIcon  = createIcon('#e67e22', 'D')   // Orange — Donor
const openIcon   = createIcon('#2ecc71')         // Green  — Open listing
const claimedIcon = createIcon('#9b59b6')        // Purple — Claimed listing
const completedIcon = createIcon('#95a5a6')      // Grey   — Completed

/* ── Map auto-fit sub-component ── */
function MapFitter({ markers }) {
    const map = useMap()

    useEffect(() => {
        if (!markers || markers.length === 0) return
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
        }
    }, [markers, map])

    return null
}

const STATUS_ICON = {
    open: openIcon,
    in_discussion: claimedIcon,
    claimed: claimedIcon,
    scheduled: claimedIcon,
    in_transit: claimedIcon,
    completed: completedIcon,
}

export default function MapControl({ ngos, donors, listings }) {
    const wrapRef = useRef(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 500)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!wrapRef.current || !isReady) return
        gsap.from(wrapRef.current, {
            scale: 0.92,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            delay: 0.3,
        })
    }, [isReady])

    /* ── Collect all markers ── */
    const allMarkers = []

    ;(ngos || []).forEach(n => {
        if (n.latitude && n.longitude) {
            allMarkers.push({
                lat: parseFloat(n.latitude),
                lng: parseFloat(n.longitude),
                type: 'ngo',
                label: n.ngo_name || 'NGO',
                detail: `${n.city || ''}${n.contact_person ? ` · ${n.contact_person}` : ''}`,
                extra: n.verification_status ? '✓ Verified' : '⏳ Pending',
                icon: ngoIcon,
            })
        }
    })

    ;(donors || []).forEach(d => {
        if (d.latitude && d.longitude) {
            allMarkers.push({
                lat: parseFloat(d.latitude),
                lng: parseFloat(d.longitude),
                type: 'donor',
                label: d.profiles?.organization_name || 'Donor',
                detail: d.city || '',
                extra: d.business_type || '',
                icon: donorIcon,
            })
        }
    })

    ;(listings || []).forEach(l => {
        if (l.latitude && l.longitude) {
            allMarkers.push({
                lat: parseFloat(l.latitude),
                lng: parseFloat(l.longitude),
                type: 'listing',
                label: l.food_type || 'Donation',
                detail: `${l.quantity_kg || 0} kg`,
                extra: l.status || 'open',
                icon: STATUS_ICON[l.status] || openIcon,
            })
        }
    })

    const center = allMarkers.length > 0
        ? [allMarkers[0].lat, allMarkers[0].lng]
        : [20.5937, 78.9629]   // India centre fallback

    const ngoCount    = allMarkers.filter(m => m.type === 'ngo').length
    const donorCount  = allMarkers.filter(m => m.type === 'donor').length
    const listingCount = allMarkers.filter(m => m.type === 'listing').length

    return (
        <section className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">Live Resource Map</h2>
                    <p className="admin-section__subtitle">
                        {ngoCount} NGOs · {donorCount} Donors · {listingCount} Donations
                    </p>
                </div>
            </div>

            <div className="admin-map-wrap" ref={wrapRef}>
                {isReady && (
                    <MapContainer
                        center={center}
                        zoom={5}
                        className="admin-map-container"
                        scrollWheelZoom={true}
                        zoomControl={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapFitter markers={allMarkers} />

                        {allMarkers.map((m, i) => (
                            <Marker key={`${m.type}-${i}`} position={[m.lat, m.lng]} icon={m.icon}>
                                <Popup>
                                    <div style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '0.82rem', minWidth: 140 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{m.label}</div>
                                        <div style={{ color: '#666', fontSize: '0.72rem', marginBottom: 2 }}>
                                            {m.type.toUpperCase()} · {m.detail}
                                        </div>
                                        {m.extra && (
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>{m.extra}</div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {allMarkers.length === 0 && isReady && (
                    <div className="admin-empty" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p className="admin-empty__text" style={{ color: '#ccc' }}>No geo-located data yet.</p>
                        <p className="admin-empty__hint" style={{ color: '#aaa' }}>Donors and NGOs need to register with location details.</p>
                    </div>
                )}

                {/* Legend */}
                <div className="admin-map-legend">
                    <div className="admin-map-legend__item">
                        <span className="admin-map-legend__color" style={{ background: '#3498db' }} />
                        NGOs
                    </div>
                    <div className="admin-map-legend__item">
                        <span className="admin-map-legend__color" style={{ background: '#e67e22' }} />
                        Donors
                    </div>
                    <div className="admin-map-legend__item">
                        <span className="admin-map-legend__color" style={{ background: '#2ecc71' }} />
                        Open Donations
                    </div>
                    <div className="admin-map-legend__item">
                        <span className="admin-map-legend__color" style={{ background: '#9b59b6' }} />
                        Claimed/In-Transit
                    </div>
                </div>
            </div>
        </section>
    )
}