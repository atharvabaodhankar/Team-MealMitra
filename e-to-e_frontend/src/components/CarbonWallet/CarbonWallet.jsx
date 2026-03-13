import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import CarbonConversionAnimation from './CarbonConversionAnimation'
import './carbonWallet.css'

const THRESHOLD = 100

/**
 * CarbonWallet
 *
 * Unified Impact Points + Carbon Credits display.
 * Fires the conversion animation when:
 *   - IP crosses 100 during a live session
 *   - User first lands on the page with IP >= 100 (first-visit trigger)
 *
 * @param {{ impact_points_balance: number, carbon_credits: number, lifetime_impact_points: number }} impactSummary
 * @param {boolean} loading
 */
export default function CarbonWallet({ impactSummary, loading = false }) {
    const ipValueRef = useRef(null)
    const creditValueRef = useRef(null)
    const ipCardRef = useRef(null)
    const creditCardRef = useRef(null)
    const arcRef = useRef(null)

    // Track previous IP to detect threshold crossing
    const prevIPRef = useRef(null)
    const hasTriggeredFirstVisit = useRef(false)
    const [animTrigger, setAnimTrigger] = useState(false)

    /* ── Animate arc fill ── */
    const animateArc = useCallback((toPercent) => {
        const arc = arcRef.current
        if (!arc) return
        const r = 38
        const circumference = 2 * Math.PI * r
        const target = circumference - (toPercent / 100) * circumference

        gsap.fromTo(
            arc,
            { strokeDashoffset: circumference },
            {
                strokeDashoffset: target,
                duration: 1,
                ease: 'power3.out',
            }
        )
    }, [])

    /* ── Animate counter ── */
    const animateCounter = useCallback((el, fromVal, toVal) => {
        if (!el) return
        const obj = { val: fromVal ?? 0 }
        gsap.to(obj, {
            val: toVal,
            duration: 1,
            ease: 'power3.out',
            onUpdate: () => {
                if (el) el.textContent = Math.round(obj.val)
            },
        })
    }, [])

    /* ── Subtle glow pulse on the IP card ── */
    const pulseIPCard = useCallback(() => {
        const card = ipCardRef.current
        if (!card) return
        gsap.fromTo(
            card,
            { boxShadow: '0 2px 8px rgba(68,60,60,0.04), 0 8px 24px rgba(68,60,60,0.03)' },
            {
                boxShadow: '0 2px 8px rgba(212,204,202,0.4), 0 8px 32px rgba(212,204,202,0.25)',
                duration: 0.5,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut',
            }
        )
    }, [])

    useEffect(() => {
        if (loading || !impactSummary) return

        const ip = impactSummary.impact_points_balance ?? 0
        const credits = impactSummary.carbon_credits ?? 0
        const prevIP = prevIPRef.current

        // Count-up animation
        animateCounter(ipValueRef.current, prevIP ?? ip, ip)
        animateCounter(creditValueRef.current, credits, credits)

        // Arc fill
        const pct = Math.min(100, Math.max(0, ip))
        animateArc(pct)

        // Pulse on any increase
        if (prevIP !== null && ip > prevIP) {
            pulseIPCard()
        }

        // ═══ TRIGGER CONDITIONS ═══

        // Condition 1: Live threshold crossing (prev < 100, now >= 100)
        if (prevIP !== null && prevIP < THRESHOLD && ip >= THRESHOLD) {
            setTimeout(() => setAnimTrigger(true), 1100)
        }

        // Condition 2: First visit — page loads with IP already >= 100
        // (only fire once per mount, with a cinematic delay)
        if (!hasTriggeredFirstVisit.current && prevIP === null && ip >= THRESHOLD) {
            hasTriggeredFirstVisit.current = true
            setTimeout(() => setAnimTrigger(true), 2000)
        }

        prevIPRef.current = ip
    }, [impactSummary, loading, animateCounter, animateArc, pulseIPCard])

    /* ── Card entrance lift (credit card) when trigger fires ── */
    useEffect(() => {
        if (!animTrigger) return
        const card = creditCardRef.current
        if (!card) return
        gsap.to(card, {
            y: -6,
            boxShadow: '0 16px 48px rgba(68,60,60,0.12)',
            duration: 0.4,
            ease: 'power3.out',
            onComplete: () => {
                gsap.to(card, {
                    y: 0,
                    boxShadow: '0 2px 8px rgba(68,60,60,0.04), 0 8px 24px rgba(68,60,60,0.03)',
                    duration: 0.6,
                    ease: 'power3.out',
                    delay: 1.5,
                })
            },
        })
    }, [animTrigger])

    const handleAnimComplete = () => setAnimTrigger(false)

    const ip = impactSummary?.impact_points_balance ?? 0
    const credits = impactSummary?.carbon_credits ?? 0
    const pct = Math.min(100, Math.max(0, ip))
    const r = 38
    const circumference = 2 * Math.PI * r

    if (loading) {
        return (
            <div className="cw-grid">
                <div className="cw-card cw-skeleton" />
                <div className="cw-card cw-skeleton" />
            </div>
        )
    }

    return (
        <>
            <CarbonConversionAnimation trigger={animTrigger} onComplete={handleAnimComplete} />

            <div className="cw-grid">
                {/* ── Impact Points Card ── */}
                <div className="cw-card cw-card--ip" ref={ipCardRef}>
                    <div className="cw-card__header">
                        <span className="cw-card__label">IMPACT POINTS</span>
                        <span className="cw-card__sublabel">per delivery cycle</span>
                    </div>

                    <div className="cw-ip-body">
                        {/* SVG arc gauge */}
                        <div className="cw-arc-wrap" aria-label={`${ip} of 100 impact points`}>
                            <svg viewBox="0 0 100 100" className="cw-arc-svg" aria-hidden="true">
                                {/* Track */}
                                <circle
                                    cx="50" cy="50" r={r}
                                    fill="none"
                                    stroke="rgba(212,204,202,0.25)"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                />
                                {/* Fill arc */}
                                <circle
                                    ref={arcRef}
                                    cx="50" cy="50" r={r}
                                    fill="none"
                                    stroke="var(--tundora)"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (pct / 100) * circumference}
                                    transform="rotate(-90 50 50)"
                                    style={{ transition: 'none' }}
                                />
                            </svg>

                            <div className="cw-arc-inner">
                                <span className="cw-ip-value" ref={ipValueRef}>{ip}</span>
                                <span className="cw-ip-denom">/ 100</span>
                            </div>
                        </div>

                        <div className="cw-ip-meta">
                            <div className="cw-ip-threshold">
                                <div
                                    className="cw-ip-bar-track"
                                    role="progressbar"
                                    aria-valuenow={ip}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div
                                        className="cw-ip-bar-fill"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="cw-ip-bar-labels">
                                    <span>0</span>
                                    <span className="cw-ip-bar-target">100 pts = 1 Carbon Credit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Carbon Credits Card ── */}
                <div className="cw-card cw-card--credit" ref={creditCardRef}>
                    <div className="cw-card__header">
                        <span className="cw-card__label">CARBON CREDITS</span>
                        <span className="cw-card__sublabel">verified environmental asset</span>
                    </div>

                    <div className="cw-credit-body">
                        <div className="cw-coin" aria-label="Carbon Coin">
                            <span className="cw-coin__label">1 CC</span>
                        </div>

                        <div className="cw-credit-meta">
                            <span className="cw-credit-value" ref={creditValueRef}>{credits}</span>
                            <span className="cw-credit-unit">credits earned</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
