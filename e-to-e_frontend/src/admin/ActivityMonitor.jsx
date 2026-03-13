import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Radio } from 'lucide-react'

function timeAgo(date) {
    const now = new Date()
    const diff = Math.floor((now - new Date(date)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export default function ActivityMonitor({ feed }) {
    const listRef = useRef(null)
    const prevLengthRef = useRef(0)

    useEffect(() => {
        if (!listRef.current || !feed.length) return

        const newCount = feed.length - prevLengthRef.current
        if (newCount > 0) {
            const items = listRef.current.querySelectorAll('.admin-activity__item')
            const newItems = Array.from(items).slice(0, Math.max(newCount, 0))

            newItems.forEach(item => {
                item.classList.add('admin-activity__item--new')
                gsap.from(item, {
                    y: -30,
                    opacity: 0,
                    duration: 0.5,
                    ease: 'power2.out',
                })
            })
        }

        prevLengthRef.current = feed.length
    }, [feed])

    if (!feed || feed.length === 0) {
        return (
            <div className="admin-section">
                <div className="admin-section__header">
                    <div>
                        <h2 className="admin-section__title">System Activity</h2>
                        <p className="admin-section__subtitle">Live platform events</p>
                    </div>
                </div>
                <div className="admin-activity">
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <Radio size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">No activity yet.</p>
                        <p className="admin-empty__hint">Events will appear here as users interact with the platform.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">System Activity</h2>
                    <p className="admin-section__subtitle">Live platform events</p>
                </div>
                <div className="admin-section__actions">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {feed.length} events
                    </span>
                </div>
            </div>

            <div className="admin-activity">
                <div className="admin-activity__list" ref={listRef}>
                    {feed.map(item => (
                        <div key={item.id} className="admin-activity__item">
                            <span className={`admin-activity__dot admin-activity__dot--${item.type}`} />
                            <div className="admin-activity__text">
                                <div
                                    className="admin-activity__msg"
                                    dangerouslySetInnerHTML={{ __html: item.message }}
                                />
                                <span className="admin-activity__time">{timeAgo(item.time)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
