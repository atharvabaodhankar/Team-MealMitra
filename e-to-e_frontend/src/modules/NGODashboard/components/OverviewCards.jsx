import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNGO } from '../context/NGOContext'
import { animateCounter } from '../animations/ngoAnimations'

export default function OverviewCards() {
    const { t } = useTranslation('dashboard')
    const { stats, loading } = useNGO()
    const counterRefs = useRef({})

    const CARD_CONFIG = [
        {
            key: 'totalDonationsNearby',
            label: t('ngo.donationsNearby'),
            icon: '↓',
            accent: 'var(--tundora)',
        },
        {
            key: 'acceptedPickups',
            label: t('ngo.acceptedPickups'),
            icon: '✓',
            accent: 'var(--tundora)',
        },
        {
            key: 'availableVolunteers',
            label: t('ngo.availableVolunteers'),
            icon: '◉',
            accent: 'var(--pale-sky)',
        },
        {
            key: 'completedPickups',
            label: t('ngo.completedPickups'),
            icon: '★',
            accent: 'var(--boulder)',
        },
        {
            key: 'pendingRequests',
            label: t('ngo.pendingRequests'),
            icon: '⏳',
            accent: 'var(--pale-sky)',
        },
    ]

    useEffect(() => {
        if (loading.initial) return
        CARD_CONFIG.forEach((card) => {
            const el = counterRefs.current[card.key]
            const value = stats[card.key] ?? 0
            if (el) animateCounter(el, value)
        })
    }, [stats, loading.initial])

    if (loading.initial) {
        return (
            <div className="ngo-overview-grid">
                {CARD_CONFIG.map((c) => (
                    <div key={c.key} className="ngo-stat-card ngo-skeleton-card">
                        <div className="ngo-skeleton-line ngo-skeleton-line--short" />
                        <div className="ngo-skeleton-line ngo-skeleton-line--large" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="ngo-overview-grid">
            {CARD_CONFIG.map((card) => (
                <div key={card.key} className="ngo-stat-card ngo-scroll-card">
                    <div className="ngo-stat-card__header">
                        <span className="ngo-stat-card__icon" style={{ color: card.accent }}>
                            {card.icon}
                        </span>
                        <span className="ngo-stat-card__label">{card.label}</span>
                    </div>
                    <span
                        className="ngo-stat-card__value"
                        ref={(el) => { counterRefs.current[card.key] = el }}
                    >
                        0
                    </span>
                </div>
            ))}
        </div>
    )
}
