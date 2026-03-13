import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from 'gsap'
import {
    Building2,
    Handshake,
    Users,
    Package,
    Truck,
    CheckCircle2,
    Utensils,
    Wheat,
    Leaf,
} from 'lucide-react'

const STAT_CONFIG = [
    { key: 'totalNGOs', labelKey: 'totalNGOs', Icon: Building2 },
    { key: 'totalDonors', labelKey: 'totalDonors', Icon: Handshake },
    { key: 'totalVolunteers', labelKey: 'volunteers', Icon: Users },
    { key: 'totalDonations', labelKey: 'totalDonations', Icon: Package },
    { key: 'activePickups', labelKey: 'activePickups', Icon: Truck },
]

const IMPACT_CONFIG = [
    { key: 'total_meals_served', labelKey: 'mealsServed', Icon: Utensils, suffix: '' },
    { key: 'total_food_saved_kg', labelKey: 'foodSaved', Icon: Wheat, suffix: ' kg' },
    { key: 'total_co2_reduced_kg', labelKey: 'co2Reduced', Icon: Leaf, suffix: ' kg' },
]

export default function OverviewPanel({ stats, totalImpact }) {
    const { t } = useTranslation('dashboard')
    const cardsRef = useRef(null)
    const countersRef = useRef([])

    /* Animated counter */
    useEffect(() => {
        if (!stats) return

        countersRef.current.forEach((el, i) => {
            if (!el) return
            const cfg = STAT_CONFIG[i]
            const target = stats[cfg.key] ?? 0

            gsap.fromTo(
                { val: 0 },
                { val: target },
                {
                    val: target,
                    duration: 1.8,
                    delay: 1.6 + i * 0.12,
                    ease: 'power2.out',
                    onUpdate() {
                        if (el) el.textContent = Math.round(this.targets()[0].val).toLocaleString()
                    },
                }
            )
        })
    }, [stats])

    /* Hover tilt parallax */
    const handleMouseMove = (e) => {
        const card = e.currentTarget
        const rect = card.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5

        gsap.to(card, {
            rotateX: -y * 5,
            rotateY: x * 5,
            duration: 0.3,
            ease: 'power2.out',
            transformPerspective: 800,
        })
    }

    const handleMouseLeave = (e) => {
        gsap.to(e.currentTarget, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.5,
            ease: 'power2.out',
        })
    }

    return (
        <section className="admin-section" id="admin-overview-panel">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">{t('globalOverview')}</h2>
                    <p className="admin-section__subtitle">{t('realTimePlatformMetrics')}</p>
                </div>
            </div>

            <div className="admin-overview" ref={cardsRef}>
                {STAT_CONFIG.map((cfg, i) => (
                    <div
                        key={cfg.key}
                        className="admin-stat-card"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="admin-stat-card__icon">
                            <cfg.Icon size={20} strokeWidth={1.6} />
                        </div>
                        <div
                            className="admin-stat-card__value"
                            ref={(el) => (countersRef.current[i] = el)}
                        >
                            0
                        </div>
                        {cfg.suffix && <span className="admin-stat-card__suffix">{cfg.suffix}</span>}
                        <div className="admin-stat-card__label">{t(cfg.labelKey)}</div>
                        <div className="admin-stat-card__glow" />
                    </div>
                ))}
            </div>

            {/* Impact Metrics Row */}
            {totalImpact && (
                <div className="admin-overview" style={{ marginTop: 'var(--space-md)' }}>
                    {IMPACT_CONFIG.map(cfg => {
                        const val = totalImpact[cfg.key]
                        if (val == null) return null
                        return (
                            <div key={cfg.key} className="admin-stat-card" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                                <div className="admin-stat-card__icon">
                                    <cfg.Icon size={20} strokeWidth={1.6} />
                                </div>
                                <div className="admin-stat-card__value">
                                    {Number(val || 0).toLocaleString()}{cfg.suffix}
                                </div>
                                <div className="admin-stat-card__label">{t(cfg.labelKey)}</div>
                                <div className="admin-stat-card__glow" />
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}