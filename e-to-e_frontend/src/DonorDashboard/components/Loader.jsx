import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function Loader() {
    const dotsRef = useRef([])

    useEffect(() => {
        gsap.fromTo(
            dotsRef.current,
            { scale: 0.6, opacity: 0.3 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                stagger: { each: 0.15, repeat: -1, yoyo: true },
                ease: 'power2.inOut',
            }
        )
    }, [])

    return (
        <div className="dd-loader-overlay" id="dd-loader">
            <div className="dd-loader-content">
                <div className="dd-loader-brand">Extra-To-Essential</div>
                <div className="dd-loader-dots">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="dd-loader-dot"
                            ref={(el) => (dotsRef.current[i] = el)}
                        />
                    ))}
                </div>
                <span className="dd-loader-text">Loading your dashboard…</span>
            </div>
        </div>
    )
}

/* ── Skeleton Primitives ── */

export function SkeletonCard() {
    return (
        <div className="dd-skeleton dd-skeleton-card">
            <div className="dd-skeleton-line dd-skeleton-line--sm" />
            <div className="dd-skeleton-line dd-skeleton-line--lg" />
            <div className="dd-skeleton-line dd-skeleton-line--md" />
        </div>
    )
}

export function SkeletonRow() {
    return (
        <div className="dd-skeleton dd-skeleton-row">
            <div className="dd-skeleton-cell" />
            <div className="dd-skeleton-cell" />
            <div className="dd-skeleton-cell" />
            <div className="dd-skeleton-cell" />
            <div className="dd-skeleton-cell" />
        </div>
    )
}

export function SkeletonTable({ rows = 5 }) {
    return (
        <div className="dd-skeleton-table">
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    )
}
