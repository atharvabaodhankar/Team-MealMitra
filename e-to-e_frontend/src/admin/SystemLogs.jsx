import { useEffect, useRef, useMemo } from 'react'
import { gsap } from 'gsap'
import { ClipboardList } from 'lucide-react'

function formatTimestamp(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    let hours = d.getHours()
    const mins = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${day} ${mon} ${year}, ${hours}:${mins} ${ampm}`
}

export default function SystemLogs({ ngos, donors, listings }) {
    const tableRef = useRef(null)

    /* Generate logs from real data */
    const logs = useMemo(() => {
        const logEntries = []
        const now = Date.now()

            ; (ngos || []).forEach((ngo, i) => {
                logEntries.push({
                    id: `ngo-reg-${ngo.ngo_id || i}`,
                    timestamp: ngo.created_at || new Date(now - i * 3600000).toISOString(),
                    event: 'NGO Registration',
                    eventType: 'registration',
                    entity: 'NGO',
                    user: ngo.ngo_name || 'Unknown NGO',
                    location: ngo.city || '—',
                    action: `Registered from ${ngo.city || 'Unknown'}`,
                })

                if (ngo.verification_status) {
                    logEntries.push({
                        id: `ngo-ver-${ngo.ngo_id || i}`,
                        timestamp: ngo.created_at || new Date(now - i * 3000000).toISOString(),
                        event: 'NGO Verified',
                        eventType: 'verified',
                        entity: 'NGO',
                        user: 'System',
                        location: ngo.city || '—',
                        action: `${ngo.ngo_name || 'NGO'} verification approved`,
                    })
                }
            })

            ; (donors || []).forEach((d, i) => {
                logEntries.push({
                    id: `donor-reg-${d.donor_id || i}`,
                    timestamp: d.created_at || new Date(now - i * 5400000).toISOString(),
                    event: 'Donor Registration',
                    eventType: 'registration',
                    entity: 'Donor',
                    user: d.profiles?.organization_name || d.profiles?.full_name || 'Unknown Donor',
                    location: d.city || '—',
                    action: `Joined from ${d.city || 'Unknown'}`,
                })
            })

            ; (listings || []).forEach((l, i) => {
                logEntries.push({
                    id: `listing-${l.listing_id || i}`,
                    timestamp: l.created_at || new Date(now - i * 1800000).toISOString(),
                    event: 'Donation Created',
                    eventType: 'donation',
                    entity: 'Listing',
                    user: 'Donor',
                    location: l.pickup_address || '—',
                    action: `${l.food_type || 'Food'} — ${l.quantity_kg || 0} kg [${l.status || 'open'}]`,
                })

                if (l.status === 'claimed' || l.status === 'completed') {
                    logEntries.push({
                        id: `listing-status-${l.listing_id || i}`,
                        timestamp: l.updated_at || l.created_at || new Date(now - i * 1200000).toISOString(),
                        event: 'Status Change',
                        eventType: 'status',
                        entity: 'Listing',
                        user: 'System',
                        location: '—',
                        action: `Listing ${(l.listing_id || '').slice(0, 8)} → ${l.status}`,
                    })
                }
            })

        logEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        return logEntries.slice(0, 50)
    }, [ngos, donors, listings])

    /* Row stagger animation */
    useEffect(() => {
        if (!tableRef.current) return
        const rows = tableRef.current.querySelectorAll('tbody tr')
        if (rows.length === 0) return

        gsap.set(rows, { opacity: 1, y: 0 })
        gsap.from(rows, {
            y: 20,
            opacity: 0,
            duration: 0.4,
            stagger: 0.04,
            ease: 'power2.out',
            delay: 0.3,
            clearProps: 'all',
        })
    }, [logs])

    const getEventBadgeClass = (eventType) => {
        switch (eventType) {
            case 'registration': return 'admin-badge--pending'
            case 'verified': return 'admin-badge--verified'
            case 'status': return 'admin-badge--in_transit'
            case 'donation': return 'admin-badge--active'
            default: return 'admin-badge--pending'
        }
    }

    return (
        <section className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">System Logs</h2>
                    <p className="admin-section__subtitle">{logs.length} log entries</p>
                </div>
            </div>

            <div className="admin-table-wrap" ref={tableRef}>
                {logs.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <ClipboardList size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">No system logs available.</p>
                        <p className="admin-empty__hint">Logs will populate as platform activity occurs.</p>
                    </div>
                ) : (
                    <table className="admin-table admin-table--logs">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Event</th>
                                <th>Entity</th>
                                <th>User</th>
                                <th>Location</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="admin-log-timestamp">
                                        {formatTimestamp(log.timestamp)}
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${getEventBadgeClass(log.eventType)}`}>
                                            {log.event}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                                        {log.entity}
                                    </td>
                                    <td className="admin-log-user">
                                        {log.user}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: '#5a5252' }}>
                                        {log.location}
                                    </td>
                                    <td className="admin-log-action">
                                        {log.action}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    )
}