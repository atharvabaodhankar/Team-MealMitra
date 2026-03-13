import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import './carbonWallet.css'

/**
 * CarbonConversionAnimation — Premium GSAP Cinematic Sequence
 *
 * When `trigger` becomes true the full sequence fires:
 *   ACT I   — Dark frosted-glass overlay + shockwave ring
 *   ACT II  — Golden sparkle particles burst from centre
 *   ACT III — 3D coin materialises, spins 360° with golden shimmer trail
 *   ACT IV  — "Carbon Credit Minted" text reveal
 *   ACT V   — Coin arcs smoothly into the Carbon Credits card
 *   ACT VI  — Card golden pulse, overlay dissolves
 *
 * Uses GSAP premium techniques: timeline nesting, stagger functions,
 * easeEach, functional values, autoAlpha, clearProps, and elastic/back easing.
 *
 * @param {boolean}  trigger    – flip to true to fire the sequence.
 * @param {function} onComplete – called when sequence finishes (resets trigger).
 */
export default function CarbonConversionAnimation({ trigger, onComplete }) {
    const overlayRef = useRef(null)
    const shockwaveRef = useRef(null)
    const particleRef = useRef(null)
    const coinRef = useRef(null)
    const coinFrontRef = useRef(null)
    const coinBackRef = useRef(null)
    const glowRef = useRef(null)
    const shimmerRef = useRef(null)
    const textRef = useRef(null)
    const trailRef = useRef(null)
    const tlRef = useRef(null)

    const prefersReduced = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false

    const runSequence = useCallback(() => {
        if (prefersReduced) {
            if (onComplete) onComplete()
            return
        }

        const overlay = overlayRef.current
        const shockwave = shockwaveRef.current
        const particles = particleRef.current
        const coin = coinRef.current
        const glow = glowRef.current
        const shimmer = shimmerRef.current
        const textEl = textRef.current
        const trail = trailRef.current
        if (!overlay || !particles || !coin) return

        // Kill any in-progress animation
        if (tlRef.current) {
            tlRef.current.kill()
            tlRef.current = null
        }

        // Find the credit card for target position
        const creditCard = document.querySelector('.cw-card--credit')

        /* ─── SPAWN PARTICLES ─── */
        particles.innerHTML = ''
        const NUM_PARTICLES = 30
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const p = document.createElement('span')
            p.className = 'cca-particle'
            const size = 3 + Math.random() * 8
            p.style.width = `${size}px`
            p.style.height = `${size}px`
            // Golden palette with some variety
            const hue = 38 + Math.random() * 15
            const light = 50 + Math.random() * 30
            p.style.background = i % 4 === 0
                ? 'rgba(255, 255, 255, 0.9)'
                : `hsl(${hue}, 95%, ${light}%)`
            particles.appendChild(p)
        }
        const dots = particles.querySelectorAll('.cca-particle')

        /* ─── SPAWN TRAIL PARTICLES ─── */
        if (trail) {
            trail.innerHTML = ''
            for (let i = 0; i < 12; i++) {
                const t = document.createElement('span')
                t.className = 'cca-trail-dot'
                trail.appendChild(t)
            }
        }

        /* ═══════════════════════════════════════════════════
           MASTER TIMELINE — Film-grade choreography
           ═══════════════════════════════════════════════════ */
        const tl = gsap.timeline({
            defaults: { ease: 'power3.out', overwrite: 'auto' },
            onComplete: () => {
                // Clean up everything
                const els = [overlay, coin, particles, glow, shimmer, textEl, trail, shockwave].filter(Boolean)
                gsap.set(els, { autoAlpha: 0, clearProps: 'all' })
                if (coin) gsap.set(coin, { x: 0, y: 0, scale: 1, rotateY: 0, autoAlpha: 0 })
                particles.innerHTML = ''
                if (trail) trail.innerHTML = ''
                if (onComplete) onComplete()
            },
        })
        tlRef.current = tl

        /* ═══════════════════════════════════════
           ACT I — Dark frosted overlay + shockwave
           ═══════════════════════════════════════ */
        tl.set([overlay, particles, coin, glow, shimmer, textEl, trail, shockwave].filter(Boolean), {
            autoAlpha: 0,
        })

        // Overlay fades in with blur
        tl.to(overlay, {
            autoAlpha: 1,
            duration: 0.6,
            ease: 'power2.out',
        })

        // Shockwave ring expands from center
        if (shockwave) {
            tl.fromTo(shockwave,
                { autoAlpha: 0.8, scale: 0 },
                {
                    autoAlpha: 0,
                    scale: 3,
                    duration: 0.9,
                    ease: 'expo.out',
                },
                '-=0.3'
            )
        }

        /* ═══════════════════════════════════════
           ACT II — Golden sparkle burst
           ═══════════════════════════════════════ */
        tl.set(particles, { autoAlpha: 1 }, '-=0.5')

        // Particles explode outward
        tl.fromTo(
            dots,
            { x: 0, y: 0, scale: 0, opacity: 1, rotation: 0 },
            {
                x: () => (Math.random() - 0.5) * 400,
                y: () => (Math.random() - 0.5) * 400,
                scale: () => 0.6 + Math.random() * 1.8,
                rotation: () => Math.random() * 360,
                opacity: 0.85,
                duration: 0.8,
                stagger: {
                    each: 0.015,
                    from: 'center',
                    ease: 'power2.out',
                },
                ease: 'expo.out',
            },
            '-=0.4'
        )

        // Particles converge back to form coin
        tl.to(
            dots,
            {
                x: 0,
                y: 0,
                scale: 0,
                opacity: 0,
                rotation: 720,
                duration: 0.9,
                stagger: {
                    each: 0.012,
                    from: 'edges',
                    ease: 'power3.in',
                },
                ease: 'power4.in',
            },
            '+=0.1'
        )

        /* ═══════════════════════════════════════
           ACT III — Coin materialises + 360° spin
           ═══════════════════════════════════════ */

        // Coin starts invisible, scaled down, rotated back
        tl.set(coin, {
            autoAlpha: 1,
            scale: 0.15,
            rotateY: -180,
            x: 0,
            y: 0,
        }, '-=0.4')

        // Dramatic scale-up with elastic bounce
        tl.to(coin, {
            scale: 1.1,
            duration: 0.7,
            ease: 'back.out(2.0)',
        }, '-=0.3')

        // Settle to natural size
        tl.to(coin, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
        })

        // Glow ring radiates behind coin
        if (glow) {
            tl.fromTo(glow,
                { autoAlpha: 0, scale: 0.3 },
                {
                    autoAlpha: 1,
                    scale: 2.0,
                    duration: 1.0,
                    ease: 'power2.out',
                },
                '-=0.8'
            )
        }

        // Shimmer light sweep across coin
        if (shimmer) {
            tl.fromTo(shimmer,
                { autoAlpha: 0.8, x: -70 },
                {
                    x: 70,
                    autoAlpha: 0,
                    duration: 0.6,
                    ease: 'power2.inOut',
                },
                '-=0.5'
            )
        }

        // ★ THE BIG 360° SPIN ★
        tl.to(coin, {
            rotateY: 360,
            duration: 1.8,
            ease: 'power2.inOut',
        }, '-=0.6')

        // Glow fades during spin
        if (glow) {
            tl.to(glow, {
                autoAlpha: 0,
                scale: 2.8,
                duration: 0.8,
                ease: 'power2.in',
            }, '-=0.8')
        }

        /* ═══════════════════════════════════════
           ACT IV — "Carbon Credit Minted" text
           ═══════════════════════════════════════ */
        if (textEl) {
            tl.fromTo(textEl,
                { autoAlpha: 0, y: 30, scale: 0.9 },
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: 'back.out(1.4)',
                },
                '-=1.0'
            )

            // Hold for a beat, then fade out before coin flies
            tl.to(textEl, {
                autoAlpha: 0,
                y: -15,
                scale: 0.95,
                duration: 0.35,
                ease: 'power2.in',
            }, '+=0.5')
        }

        /* ═══════════════════════════════════════
           ACT V — Coin arcs into the credit card
           ═══════════════════════════════════════ */
        if (creditCard) {
            const cardRect = creditCard.getBoundingClientRect()
            const viewW = window.innerWidth
            const viewH = window.innerHeight

            const targetX = (cardRect.left + cardRect.width / 2) - (viewW / 2)
            const targetY = (cardRect.top + cardRect.height / 2) - (viewH / 2)

            // Show golden trail behind coin
            if (trail) {
                tl.set(trail, { autoAlpha: 1 })
                const trailDots = trail.querySelectorAll('.cca-trail-dot')
                if (trailDots.length) {
                    // Trail dots follow coin with stagger
                    trailDots.forEach((dot, i) => {
                        const delay = 0.04 * i
                        const tween = gsap.timeline()
                        tween.set(dot, { autoAlpha: 0.7 - (i * 0.05), scale: 1 - (i * 0.07) })
                        tween.to(dot, {
                            x: targetX * 0.3,
                            y: -60 - (i * 5),
                            duration: 0.35,
                            ease: 'power2.out',
                            delay,
                        })
                        tween.to(dot, {
                            x: targetX,
                            y: targetY,
                            autoAlpha: 0,
                            scale: 0,
                            duration: 0.5,
                            ease: 'power3.in',
                        })
                        tl.add(tween, '<')
                    })
                }
            }

            // Phase 1: arc upward
            tl.to(coin, {
                x: targetX * 0.3,
                y: -70,
                scale: 0.7,
                rotateY: '+=180',
                duration: 0.4,
                ease: 'power2.out',
            }, '<')

            // Phase 2: swoop down to card
            tl.to(coin, {
                x: targetX,
                y: targetY,
                scale: 0.15,
                rotateY: '+=180',
                duration: 0.55,
                ease: 'power4.in',
            })

            // Coin vanishes on impact
            tl.to(coin, {
                autoAlpha: 0,
                duration: 0.1,
            }, '-=0.1')

            /* ═══════════════════════════════════════
               ACT VI — Credit card golden impact pulse
               ═══════════════════════════════════════ */

            // Golden flash
            tl.to(creditCard, {
                boxShadow: '0 0 50px rgba(255, 215, 0, 0.7), 0 0 100px rgba(184, 134, 11, 0.35), inset 0 0 20px rgba(255, 215, 0, 0.15)',
                scale: 1.05,
                borderColor: 'rgba(255, 215, 0, 0.6)',
                duration: 0.35,
                ease: 'power3.out',
            })

            // Elastic settle back
            tl.to(creditCard, {
                boxShadow: '0 2px 8px rgba(68,60,60,0.04), 0 8px 24px rgba(68,60,60,0.03)',
                scale: 1,
                borderColor: 'rgba(184, 134, 11, 0.25)',
                duration: 1.0,
                ease: 'elastic.out(1, 0.5)',
                clearProps: 'boxShadow,scale,borderColor',
            })
        } else {
            // Fallback — no card found
            tl.to(coin, {
                scale: 0.2,
                autoAlpha: 0,
                rotateY: '+=180',
                duration: 0.6,
                ease: 'power3.in',
            }, '+=0.3')
        }

        /* ═══════════════════════════════════════
           FINALE — Overlay dissolves
           ═══════════════════════════════════════ */
        tl.to(overlay, {
            autoAlpha: 0,
            duration: 0.6,
            ease: 'power2.inOut',
        }, '-=0.5')

    }, [onComplete, prefersReduced])

    useEffect(() => {
        if (trigger) runSequence()
    }, [trigger, runSequence])

    return (
        <div
            ref={overlayRef}
            className="cca-overlay"
            aria-hidden="true"
            style={{ opacity: 0, visibility: 'hidden' }}
        >
            {/* Shockwave ring */}
            <div
                ref={shockwaveRef}
                className="cca-shockwave"
                style={{ opacity: 0, visibility: 'hidden' }}
            />

            {/* Particle field */}
            <div ref={particleRef} className="cca-particles" />

            {/* Radial glow behind coin */}
            <div
                ref={glowRef}
                className="cca-glow-ring"
                style={{ opacity: 0, visibility: 'hidden' }}
            />

            {/* 3D Gold Coin */}
            <div
                ref={coinRef}
                className="cca-coin"
                style={{ opacity: 0, visibility: 'hidden' }}
            >
                {/* Shimmer sweep */}
                <div
                    ref={shimmerRef}
                    className="cca-coin__shimmer"
                    style={{ opacity: 0, visibility: 'hidden' }}
                />
                <div className="cca-coin__face cca-coin__front" ref={coinFrontRef}>
                    <span className="cca-coin__symbol">⟐</span>
                    <span className="cca-coin__label">1 CC</span>
                </div>
                <div className="cca-coin__face cca-coin__back" ref={coinBackRef}>
                    <span className="cca-coin__leaf">🌿</span>
                </div>
            </div>

            {/* Golden trail particles (follow coin to card) */}
            <div
                ref={trailRef}
                className="cca-trail"
                style={{ opacity: 0, visibility: 'hidden' }}
            />

            {/* Minted text */}
            <div
                ref={textRef}
                className="cca-minted-text"
                style={{ opacity: 0, visibility: 'hidden' }}
            >
                <span className="cca-minted-title">Carbon Credit Minted</span>
                <span className="cca-minted-sub">+1 Verified Environmental Asset</span>
            </div>
        </div>
    )
}
