import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE LOAD — CINEMATIC SEQUENCE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function runPageLoadSequence() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

    // 1 — Layout fade in
    tl.fromTo(
        '.ngo-layout',
        { opacity: 0 },
        { opacity: 1, duration: 0.6 }
    )

    // 2 — Sidebar slides from left
    tl.fromTo(
        '.ngo-sidebar',
        { x: -280, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9 },
        '-=0.3'
    )

    // 3 — View header reveal
    tl.fromTo(
        '.ngo-view-header',
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        '-=0.5'
    )

    // 4 — Stat cards stagger float-up
    tl.fromTo(
        '.ngo-stat-card',
        { y: 50, opacity: 0, scale: 0.92 },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'back.out(1.4)',
        },
        '-=0.4'
    )

    // 5 — Section dividers draw
    tl.fromTo(
        '.ngo-section-divider',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.6, stagger: 0.05 },
        '-=0.3'
    )

    return tl
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SCROLL-TRIGGERED ANIMATIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function initScrollAnimations() {
    const isMobile = window.innerWidth < 768
    const dur = isMobile ? 0.7 : 1

    // Cards → scale + fade
    gsap.utils.toArray('.ngo-scroll-card').forEach((el) => {
        gsap.fromTo(
            el,
            { opacity: 0, scale: 0.94 },
            {
                opacity: 1,
                scale: 1,
                duration: dur,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            }
        )
    })

    // Tables → slide right
    gsap.utils.toArray('.ngo-scroll-table').forEach((el) => {
        gsap.fromTo(
            el,
            { x: 40, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: dur,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        )
    })

    // Forms → slide left
    gsap.utils.toArray('.ngo-scroll-form').forEach((el) => {
        gsap.fromTo(
            el,
            { x: -40, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: dur,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        )
    })

    // Map → zoom fade
    gsap.utils.toArray('.ngo-scroll-map').forEach((el) => {
        gsap.fromTo(
            el,
            { scale: 0.9, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 1.2 * (isMobile ? 0.7 : 1),
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            }
        )
    })
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COUNTER ANIMATION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateCounter(element, targetValue) {
    if (!element) return
    const obj = { val: 0 }
    gsap.to(obj, {
        val: targetValue,
        duration: 2,
        ease: 'power3.out',
        onUpdate: () => {
            element.textContent = Math.round(obj.val).toLocaleString()
        },
    })
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ROW STAGGER ANIMATION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateRowsStagger(selector) {
    gsap.fromTo(
        selector,
        { y: 16, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power2.out',
        }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAP MARKER DROP + BOUNCE
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
            duration: 0.8,
            ease: 'bounce.out',
        }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ROUTE LINE DRAW
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
   BUTTON PRESS — SHRINK → REBOUND
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateButtonPress(btnEl) {
    if (!btnEl) return
    const tl = gsap.timeline()
    tl.to(btnEl, { scale: 0.93, duration: 0.12, ease: 'power2.in' })
        .to(btnEl, { scale: 1.05, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
        .to(btnEl, { scale: 1, duration: 0.2, ease: 'power2.out' })
    return tl
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SUCCESS PULSE RING
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function playSuccessRing(element) {
    if (!element) return
    const ring = document.createElement('span')
    ring.className = 'ngo-success-ring'
    element.style.position = 'relative'
    element.appendChild(ring)

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
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ROW HIGHLIGHT FLASH
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function flashRow(rowElement) {
    if (!rowElement) return
    gsap.fromTo(
        rowElement,
        { backgroundColor: 'rgba(68, 60, 60, 0.08)' },
        {
            backgroundColor: 'transparent',
            duration: 1.5,
            ease: 'power2.out',
        }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CARD PULSE HIGHLIGHT (new donation arrives)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function pulseCard(cardElement) {
    if (!cardElement) return
    const tl = gsap.timeline()
    tl.to(cardElement, {
        boxShadow: '0 0 24px rgba(68, 60, 60, 0.2)',
        scale: 1.03,
        duration: 0.3,
        ease: 'power2.out',
    }).to(cardElement, {
        boxShadow: '0 2px 12px rgba(68, 60, 60, 0.06)',
        scale: 1,
        duration: 0.6,
        ease: 'power2.out',
    })
    return tl
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOAST SLIDE-IN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateToastIn(toastEl) {
    if (!toastEl) return
    gsap.fromTo(
        toastEl,
        { x: 320, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }
    )
}

export function animateToastOut(toastEl) {
    if (!toastEl) return
    return gsap.to(toastEl, {
        x: 320,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
    })
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CALL ALERT POPUP
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateCallAlertIn(overlayEl, cardEl) {
    const tl = gsap.timeline()
    if (overlayEl) {
        tl.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 })
    }
    if (cardEl) {
        tl.fromTo(
            cardEl,
            { scale: 0.7, opacity: 0, y: 30 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' },
            '-=0.1'
        )
    }
    return tl
}

export function animateCallAlertOut(overlayEl, cardEl) {
    const tl = gsap.timeline()
    if (cardEl) {
        tl.to(cardEl, { scale: 0.8, opacity: 0, duration: 0.25, ease: 'power2.in' })
    }
    if (overlayEl) {
        tl.to(overlayEl, { opacity: 0, duration: 0.2 }, '-=0.1')
    }
    return tl
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VIEW TRANSITION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function animateViewEnter(containerEl) {
    if (!containerEl) return
    gsap.fromTo(
        containerEl,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CLEANUP
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function killAllAnimations() {
    ScrollTrigger.getAll().forEach((t) => t.kill())
    gsap.killTweensOf('*')
}
