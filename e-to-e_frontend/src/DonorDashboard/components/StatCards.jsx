import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { animateCounter } from '../animations/dashboardAnimations'
import { SkeletonCard } from './Loader'

export default function StatCards({ stats, loading }) {
    const { t } = useTranslation('dashboard')
    const counterRefs = useRef([])

    const STATS_CONFIG = [
        { key: 'total', label: t('totalDonations'), icon: '◆' },
        { key: 'active', label: t('activePickups'), icon: '↗' },
        { key: 'completed', label: t('completed'), icon: '✓' },
        { key: 'ngos', label: t('deliveries'), icon: '◎' },
    ]

    useEffect(() => {
        if (loading || !stats) return
        const values = [
            stats.total ?? 0,
            stats.active ?? 0,
            stats.completed ?? 0,
            stats.ngos ?? 0,
        ]
        values.forEach((val, idx) => {
            if (counterRefs.current[idx]) {
                animateCounter(counterRefs.current[idx], val)
            }
        })
    }, [stats, loading])

    if (loading) {
        return (
            <div className="dd-stat-cards-grid">
                {STATS_CONFIG.map((s) => (
                    <SkeletonCard key={s.key} />
                ))}
            </div>
        )
    }

    const values = [
        stats?.total ?? 0,
        stats?.active ?? 0,
        stats?.completed ?? 0,
        stats?.ngos ?? 0,
    ]

    return (
        <div className="dd-stat-cards-grid">
            {STATS_CONFIG.map((stat, idx) => (
                <div key={stat.key} className="dd-stat-card">
                    <div className="dd-stat-card__icon-wrap">
                        <span className="dd-stat-card__icon">{stat.icon}</span>
                    </div>
                    <div className="dd-stat-card__value">
                        <span ref={(el) => (counterRefs.current[idx] = el)}>
                            {values[idx]}
                        </span>
                    </div>
                    <div className="dd-stat-card__label">{stat.label}</div>
                </div>
            ))}
        </div>
    )
}
