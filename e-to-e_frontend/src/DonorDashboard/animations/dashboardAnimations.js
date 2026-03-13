import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE LOAD — CINEMATIC SEQUENCE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function runPageLoadSequence() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

    // 1 — Navbar slides down + fade
    tl.fromTo(
        '.dd-navbar',
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
    )

    // 2 — Section label cinematic reveal
    tl.fromTo(
        '.dd-section-label',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.04 },
        '-=0.4'
    )

    // 3 — Section title reveal
    tl.fromTo(
        '.dd-section-title',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05 },
        '-=0.3'
    )

    // 4 — Stat cards stagger float-in
    tl.fromTo(
        '.dd-stat-card',
        { y: 50, opacity: 0, scale: 0.92 },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'back.out(1.4)',
        },
        '-=0.2'
    )

    // 5 — Section dividers draw in
    tl.fromTo(
        '.dd-section-divider',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.4, stagger: 0.03 },
        '-=0.2'
    )

    return tl
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SCROLL-TRIGGERED SECTION ANIMATIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function initScrollAnimations() {
    const isMobile = window.innerWidth < 768
    const dur = isMobile ? 0.7 : 1

    // Overview section → fade + scale
    gsap.fromTo(
        '#overview-section',
        { opacity: 0, scale: 0.96 },
        {
            opacity: 1,
            scale: 1,
            duration: dur,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '#overview-section',
                start: 'top 85%',
                toggleActions: 'play none none reverse',
            },
        }
    )

    // Form section → slide from left
    gsap.fromTo(
        '#create-donation-section .dd-donation-form',
        { x: -40, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: dur,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: '#create-donation-section',
                start: 'top 80%',
                toggleActions: 'play none none reverse',
            },
        }
    )

    // Active table → slide from right
    gsap.fromTo(
        '#active-donations-section .dd-table-wrap, #active-donations-section .dd-empty-state',
        { x: 40, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: dur,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: '#active-donations-section',
                start: 'top 80%',
                toggleActions: 'play none none reverse',
            },
        }
    )

    // Tracking map → zoom reveal
    gsap.fromTo(
        '#tracking-section .dd-tracking-map-wrapper',
        { scale: 0.92, opacity: 0 },
        {
            scale: 1,
            opacity: 1,
            duration: 1.2 * (isMobile ? 0.7 : 1),
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '#tracking-section',
                start: 'top 80%',
                toggleActions: 'play none none reverse',
            },
        }
    )

    // History → stagger rows
    gsap.fromTo(
        '#history-section .dd-table-wrap, #history-section .dd-empty-state',
        { y: 40, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 0.9 * (isMobile ? 0.7 : 1),
            ease: 'expo.out',
            scrollTrigger: {
                trigger: '#history-section',
                start: 'top 80%',
                toggleActions: 'play none none reverse',
            },
        }
    )

    // Blog cards stagger
    gsap.fromTo(
        '.dd-blog-card',
        { y: 40, opacity: 0, scale: 0.95 },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'back.out(1.2)',
            scrollTrigger: {
                trigger: '.dd-blog-panel',
                start: 'top 85%',
                toggleActions: 'play none none reverse',
            },
        }
    )

    // Parallax depth effect (desktop only)
    if (!isMobile) {
        gsap.utils.toArray('.dd-parallax-bg').forEach((el) => {
            gsap.to(el, {
                y: -40,
                ease: 'none',
                scrollTrigger: {
                    trigger: el,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5,
                },
            })
        })

        // Background pattern parallax (slower)
        gsap.utils.toArray('.dd-section--overview::before, .dd-section--tracking::before').forEach((el) => {
            gsap.to(el, {
                y: -20,
                ease: 'none',
                scrollTrigger: {
                    trigger: el,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 2,
                },
            })
        })
    }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HISTORY ROW STAGGER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateHistoryRows() {
    gsap.fromTo(
        '.dd-history-row',
        { y: 20, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.dd-history-table',
                start: 'top 80%',
                toggleActions: 'play none none reverse',
            },
        }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ACTIVE TABLE ROW STAGGER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateActiveRows() {
    gsap.fromTo(
        '.dd-active-row',
        { y: 16, opacity: 0, x: -10 },
        {
            y: 0,
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power2.out',
        }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COUNTER ANIMATION (stat cards)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateCounter(element, targetValue) {
    const obj = { val: 0 }
    gsap.to(obj, {
        val: targetValue,
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: () => {
            if (element) {
                element.textContent = Math.round(obj.val).toLocaleString()
            }
        },
    })
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAP MARKER BOUNCE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateMarkerDrop(markerElement) {
    if (!markerElement) return
    gsap.fromTo(
        markerElement,
        { y: -80, opacity: 0, scale: 0.6 },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'bounce.out',
        }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SUCCESS PULSE RING
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function playSuccessAnimation(buttonEl) {
    if (!buttonEl) return

    const tl = gsap.timeline()

    // Button morph sequence
    tl.to(buttonEl, {
        scale: 0.93,
        duration: 0.15,
        ease: 'power2.in',
    })
        .to(buttonEl, {
            scale: 1.06,
            duration: 0.4,
            ease: 'elastic.out(1, 0.4)',
        })
        .to(buttonEl, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
        })

    // Create pulse ring
    const ring = document.createElement('span')
    ring.className = 'dd-success-ring'
    buttonEl.style.position = 'relative'
    buttonEl.appendChild(ring)

    gsap.fromTo(
        ring,
        { scale: 0.5, opacity: 1 },
        {
            scale: 2.5,
            opacity: 0,
            duration: 0.9,
            ease: 'power2.out',
            onComplete: () => ring.remove(),
        }
    )

    return tl
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TRACKING MAP — MARKERS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateTrackingMarkers() {
    gsap.fromTo(
        '.dd-tracking-marker',
        { scale: 0, opacity: 0 },
        {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            stagger: 0.2,
            ease: 'back.out(1.7)',
        }
    )
}

export function animateRouteLine(pathElement) {
    if (!pathElement) return
    const length = pathElement.getTotalLength?.() || 500
    gsap.fromTo(
        pathElement,
        { strokeDasharray: length, strokeDashoffset: length },
        {
            strokeDashoffset: 0,
            duration: 2,
            ease: 'power2.inOut',
        }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CLEANUP
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function killAllAnimations() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    gsap.killTweensOf('*')
}
