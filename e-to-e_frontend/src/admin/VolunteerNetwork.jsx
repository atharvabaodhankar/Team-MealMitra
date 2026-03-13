import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Users, Phone, Car, Package, CircleDot } from 'lucide-react'

export default function VolunteerNetwork({ volunteers }) {
    const gridRef = useRef(null)

    useEffect(() => {
        if (!gridRef.current) return
        const cards = gridRef.current.querySelectorAll('.admin-volunteer-card')
        gsap.from(cards, {
            y: 30,
            opacity: 0,
            scale: 0.95,
            duration: 0.4,
            stagger: 0.06,
            ease: 'power2.out',
            delay: 0.2,
        })
    }, [volunteers])

    const getInitials = (name) => {
        if (!name) return '?'
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }

    if (!volunteers || volunteers.length === 0) {
        return (
            <section className="admin-section">
                <div className="admin-section__header">
                    <div>
                        <h2 className="admin-section__title">Volunteer Network</h2>
                        <p className="admin-section__subtitle">Active volunteer operations</p>
                    </div>
                </div>
                <div className="admin-table-wrap">
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <Users size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">No volunteer data available yet.</p>
                        <p className="admin-empty__hint">Volunteers will appear here once NGOs add them to their team.</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">Volunteer Network</h2>
                    <p className="admin-section__subtitle">{volunteers.length} volunteer records</p>
                </div>
            </div>

            <div className="admin-volunteer-grid" ref={gridRef}>
                {volunteers.map((v, i) => (
                    <div key={v.volunteer_id || i} className="admin-volunteer-card">
                        <div className="admin-volunteer-card__header">
                            <div className="admin-volunteer-card__avatar">
                                {getInitials(v.volunteer_name || v.full_name)}
                            </div>
                            <div>
                                <div className="admin-volunteer-card__name">
                                    {v.volunteer_name || v.full_name || 'Volunteer'}
                                </div>
                                <div className="admin-volunteer-card__ngo">
                                    {v.ngo_name || 'Unassigned'}
                                </div>
                            </div>
                        </div>

                        <div className="admin-volunteer-card__detail">
                            <span className="admin-volunteer-card__detail-icon">
                                <Phone size={13} strokeWidth={1.6} />
                            </span>
                            {v.phone || '—'}
                        </div>

                        <div className="admin-volunteer-card__detail">
                            <span className="admin-volunteer-card__detail-icon">
                                <Car size={13} strokeWidth={1.6} />
                            </span>
                            {v.vehicle_type || 'Not specified'}
                        </div>

                        <div className="admin-volunteer-card__detail">
                            <span className="admin-volunteer-card__detail-icon">
                                <Package size={13} strokeWidth={1.6} />
                            </span>
                            {v.total_deliveries != null ? `${v.total_deliveries} deliveries` : 'No deliveries yet'}
                        </div>

                        <div className="admin-volunteer-card__detail">
                            <span className="admin-volunteer-card__detail-icon">
                                <CircleDot
                                    size={13}
                                    strokeWidth={1.6}
                                    style={{ color: (v.availability_status !== false) ? '#6abf69' : '#bf6a6a' }}
                                />
                            </span>
                            {(v.availability_status !== false) ? 'Available' : 'Unavailable'}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}