import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { animateTrackingMarkers } from '../animations/dashboardAnimations'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

/* Fix Leaflet default marker icon */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

/* Custom icon for donor location */
const donorIcon = new L.Icon({
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
})

export default function TrackingMap({ listings, donorProfile }) {
    const mapRef = useRef(null)
    const [mapReady, setMapReady] = useState(false)

    // Gather active listing coordinates
    const markers = (listings || [])
        .filter((l) => l.latitude && l.longitude && l.status !== 'delivered')
        .map((l) => ({
            id: l.listing_id,
            lat: l.latitude,
            lng: l.longitude,
            label: l.food_type,
            status: l.status,
            address: l.pickup_address,
        }))

    // Donor home location
    const donorMarker = donorProfile?.latitude && donorProfile?.longitude
        ? {
            lat: donorProfile.latitude,
            lng: donorProfile.longitude,
            label: 'Your Location',
        }
        : null

    const center = donorMarker
        ? [donorMarker.lat, donorMarker.lng]
        : markers.length > 0
            ? [markers[0].lat, markers[0].lng]
            : [20.5937, 78.9629]

    useEffect(() => {
        if (mapReady && markers.length > 0) {
            setTimeout(() => animateTrackingMarkers(), 300)
        }
    }, [mapReady, markers.length])

    return (
        <div className="dd-tracking-map-wrapper">
            {/* Header bar */}
            <div className="dd-tracking-map-header">
                <span className="dd-tracking-map-header__title">Live Operations</span>
                <span className="dd-tracking-map-header__status">
                    <span className="dd-tracking-map-header__dot" />
                    {markers.length > 0 ? `${markers.length} active` : 'No active pickups'}
                </span>
            </div>

            <MapContainer
                center={center}
                zoom={donorMarker ? 12 : 5}
                className="dd-tracking-map"
                whenReady={() => setMapReady(true)}
                ref={mapRef}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Donor home marker */}
                {donorMarker && (
                    <Marker position={[donorMarker.lat, donorMarker.lng]} icon={donorIcon}>
                        <Popup>
                            <strong>Your Location</strong>
                        </Popup>
                    </Marker>
                )}

                {/* Active listing markers */}
                {markers.map((m) => (
                    <Marker key={m.id} position={[m.lat, m.lng]}>
                        <Popup>
                            <strong>{m.label}</strong>
                            <br />
                            <span style={{ fontSize: '0.85em', color: '#6c7483' }}>
                                {m.address || 'Pickup location'}
                            </span>
                            <br />
                            <em style={{ fontSize: '0.8em' }}>{m.status}</em>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {markers.length === 0 && (
                <div className="dd-tracking-empty">
                    <p>No active pickups to track right now.</p>
                    <p className="dd-empty-state__sub">
                        Active donations will appear on the map with live markers.
                    </p>
                </div>
            )}

            <div className="dd-tracking-legend">
                <span className="dd-tracking-legend__item">
                    <span className="dd-legend-dot dd-legend-dot--donor" /> Your Location
                </span>
                <span className="dd-tracking-legend__item">
                    <span className="dd-legend-dot dd-legend-dot--pickup" /> Pickup Points
                </span>
            </div>
        </div>
    )
}
